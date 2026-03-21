"""Office OS CEO Supervisor.

Autonomous infinite watchdog loop with:
- heartbeat every 30 seconds
- health check on http://127.0.0.1:8000/health
- auto-restart backend when unhealthy
- exponential backoff for Groq probe errors
- terminal-log entry written every loop to MASTER_CONTEXT.md
"""

from __future__ import annotations

import os
os.environ["OPENAI_API_KEY"] = "NA"

import json
import subprocess
import time
import signal
import sys
import urllib.error
import urllib.request
from datetime import datetime
from pathlib import Path
from typing import Optional

try:
    from groq import Groq
except Exception:  # Optional dependency fallback
    Groq = None  # type: ignore


PROJECT_ROOT = Path(__file__).resolve().parent
MASTER_CONTEXT_FILE = PROJECT_ROOT / "MASTER_CONTEXT.md"

HEALTH_URL = "http://127.0.0.1:8000/health"
HEARTBEAT_SECONDS = 30
BACKEND_BOOT_WAIT_SECONDS = 5
BACKEND_START_CMD = ["py", "-3.11", "backend/main.py"]

GROQ_HEALTH_MODEL = os.getenv("GROQ_HEALTH_MODEL", "llama-3.1-8b-instant")
GROQ_BACKOFF_INITIAL_SECONDS = 2
GROQ_BACKOFF_MAX_SECONDS = 300


class CEOSupervisor:
    def __init__(self) -> None:
        self.cycle = 0
        self.backend_process: Optional[subprocess.Popen] = None

        # Load .env manually
        env_path = PROJECT_ROOT / ".env"
        if env_path.exists():
            for line in env_path.read_text().splitlines():
                if "=" in line and not line.startswith("#"):
                    k, v = line.split("=", 1)
                    os.environ[k.strip()] = v.strip().strip('"').strip("'")

        self.groq_api_key = os.getenv("GROQ_API_KEY", "").strip()
        self.groq_next_probe_at = 0.0
        self.groq_backoff_seconds = GROQ_BACKOFF_INITIAL_SECONDS

        # Register signal handlers for clean exit toast
        signal.signal(signal.SIGINT, self._handle_exit)
        signal.signal(signal.SIGTERM, self._handle_exit)

    def _handle_exit(self, sig, frame) -> None:
        self._console("Shutdown signal received.")
        self._send_native_toast("Office OS CEO", "🚨 Office OS CEO Stopped")
        if self.backend_process:
            self.backend_process.terminate()
        sys.exit(0)

    def _send_native_toast(self, title: str, message: str) -> None:
        """Sends a native Windows toast notification via PowerShell."""
        if os.name != "nt":
            return

        ps_script = f"""
$title = "{title}"
$message = "{message}"
[void][System.Reflection.Assembly]::LoadWithPartialName('System.Windows.Forms')
$n = New-Object System.Windows.Forms.NotifyIcon
$n.Icon = [System.Drawing.SystemIcons]::Information
$n.Visible = $true
$n.ShowBalloonTip(5000, $title, $message, [System.Windows.Forms.ToolTipIcon]::Info)
"""
        try:
            flag_no_win = getattr(subprocess, "CREATE_NO_WINDOW", 0x08000000)
            subprocess.run(
                ["powershell", "-Command", ps_script],
                capture_output=True,
                check=False,
                creationflags=flag_no_win
            )
            self._console(f"Native toast sent: {message}")
        except Exception as e:
            self._console(f"Failed to send native toast: {e}")

    def run(self, once: bool = False) -> None:
        self._console("=" * 62)
        self._console("OFFICE OS — CEO AUTONOMOUS SUPERVISOR")
        self._console(
            f"heartbeat={HEARTBEAT_SECONDS}s | health={HEALTH_URL} | restart=auto"
        )
        self._console("=" * 62)

        # Send startup toast
        self._send_native_toast("Office OS CEO", "✅ Office OS CEO Started")

        try:
            while True:
                self.cycle += 1
                started_at = datetime.now()
                self._console(f"[cycle {self.cycle}] heartbeat")

                health_ok, health_detail = self._check_backend_health()
                restart_status = "not_needed"
                restart_detail = "backend healthy"

                if not health_ok:
                    restart_status, restart_detail = self._restart_backend(
                        reason="health_check_failed"
                    )
                    health_ok, health_detail = self._check_backend_health()

                groq_status, groq_detail = self._probe_groq_with_backoff()

                self._log_loop_to_master_context(
                    started_at=started_at,
                    health_ok=health_ok,
                    health_detail=health_detail,
                    restart_status=restart_status,
                    restart_detail=restart_detail,
                    groq_status=groq_status,
                    groq_detail=groq_detail,
                )

                self._console(
                    f"[cycle {self.cycle}] health={'ok' if health_ok else 'fail'} | "
                    f"restart={restart_status} | groq={groq_status}"
                )

                if once:
                    return

                time.sleep(HEARTBEAT_SECONDS)
        finally:
            # Fallback for other exit paths
            self._send_native_toast("Office OS CEO", "🚨 Office OS CEO Stopped")

    def _check_backend_health(self) -> tuple[bool, str]:
        try:
            with urllib.request.urlopen(HEALTH_URL, timeout=3) as response:
                body = response.read().decode("utf-8", errors="replace")

                if response.status != 200:
                    return False, f"http_status={response.status}"

                try:
                    payload = json.loads(body)
                except json.JSONDecodeError as exc:
                    return False, f"http=200 invalid_json={exc}"

                if isinstance(payload, dict):
                    keys = ",".join(payload.keys())
                    return True, f"http=200 json_keys=[{keys}]"

                return True, "http=200 json_non_object"

        except urllib.error.HTTPError as exc:
            return False, f"http_error={exc.code}"
        except Exception as exc:
            return False, f"connection_error={exc}"

    def _restart_backend(self, reason: str) -> tuple[str, str]:
        self._console(f"backend unhealthy -> restart ({reason})")

        if self.backend_process and self.backend_process.poll() is None:
            try:
                self.backend_process.terminate()
                self.backend_process.wait(timeout=3)
            except Exception:
                try:
                    self.backend_process.kill()
                except Exception:
                    pass

        creation_flags = 0
        if os.name == "nt":
            creation_flags = getattr(subprocess, "CREATE_NEW_PROCESS_GROUP", 0)

        try:
            self.backend_process = subprocess.Popen(
                BACKEND_START_CMD,
                cwd=str(PROJECT_ROOT),
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL,
                creationflags=creation_flags,
            )
        except Exception as exc:
            return "failed", f"spawn_error={exc}"

        time.sleep(BACKEND_BOOT_WAIT_SECONDS)
        ok, detail = self._check_backend_health()
        if ok:
            return "restarted", f"reason={reason}; {detail}"
        return "failed", f"reason={reason}; {detail}"

    def _probe_groq_with_backoff(self) -> tuple[str, str]:
        if not self.groq_api_key:
            return "skipped", "GROQ_API_KEY missing"

        now = time.time()
        if now < self.groq_next_probe_at:
            remaining = max(1, int(self.groq_next_probe_at - now))
            return "backoff_wait", f"next_probe_in={remaining}s"

        try:
            if Groq is None:
                raise RuntimeError("groq package not installed")

            client = Groq(api_key=self.groq_api_key)
            client.chat.completions.create(
                model=GROQ_HEALTH_MODEL,
                messages=[{"role": "user", "content": "health-check"}],
                max_tokens=1,
                temperature=0,
            )

            self.groq_backoff_seconds = GROQ_BACKOFF_INITIAL_SECONDS
            self.groq_next_probe_at = now + HEARTBEAT_SECONDS
            return "ok", "probe_success"

        except Exception as exc:
            backoff_now = self.groq_backoff_seconds
            self.groq_next_probe_at = now + backoff_now
            self.groq_backoff_seconds = min(
                self.groq_backoff_seconds * 2,
                GROQ_BACKOFF_MAX_SECONDS,
            )
            return "error", f"{type(exc).__name__}: {exc}; backoff={backoff_now}s"

    def _log_loop_to_master_context(
        self,
        *,
        started_at: datetime,
        health_ok: bool,
        health_detail: str,
        restart_status: str,
        restart_detail: str,
        groq_status: str,
        groq_detail: str,
    ) -> None:
        """Logs the cycle to MASTER_CONTEXT.md if there's an issue."""
        should_log = (not health_ok) or (restart_status != "not_needed") or (groq_status == "error")
        if not should_log:
            return

        entry = (
            f"[{started_at.strftime('%Y-%m-%d %H:%M:%S')}] CMD: `py -3.11 ceo.py`\n"
            f"CONTEXT: CEO autonomous loop cycle {self.cycle}.\n"
            f"PURPOSE: Heartbeat+Health+Restart+Groq-backoff supervision.\n"
            f"OUTPUT: health={'ok' if health_ok else 'fail'} ({health_detail}); "
            f"restart={restart_status} ({restart_detail}); "
            f"groq={groq_status} ({groq_detail}).\n"
            f"STATUS: {'✅ complete' if health_ok else '⚠ degraded'}"
        )
        self._append_terminal_log_entry(entry)

    def _append_terminal_log_entry(self, entry: str) -> None:
        if not MASTER_CONTEXT_FILE.exists():
            return

        header = "## 📟 TERMINAL LOG"
        text = MASTER_CONTEXT_FILE.read_text(encoding="utf-8")

        if header not in text:
            updated = text.rstrip() + f"\n\n{header}\n\n{entry}\n"
            MASTER_CONTEXT_FILE.write_text(updated, encoding="utf-8")
            return

        section_start = text.find(header) + len(header)
        next_header = text.find("\n## ", section_start)

        if next_header == -1:
            updated = text.rstrip() + "\n\n" + entry + "\n"
        else:
            before = text[:next_header].rstrip()
            after = text[next_header:]
            updated = before + "\n\n" + entry + "\n" + after

        MASTER_CONTEXT_FILE.write_text(updated, encoding="utf-8")

    @staticmethod
    def _console(message: str) -> None:
        print(f"[{datetime.now().strftime('%H:%M:%S')}] [CEO] {message}")


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="Run Office OS CEO watchdog")
    parser.add_argument(
        "--once",
        action="store_true",
        help="Run exactly one supervision loop (for quick validation).",
    )
    args = parser.parse_args()

    CEOSupervisor().run(once=args.once)