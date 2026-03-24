from youtube_transcript_api import YouTubeTranscriptApi
import json
import sys

def get_transcript(video_id):
    try:
        # Request Hindi (hi) transcript specifically
        transcript = YouTubeTranscriptApi.get_transcript(video_id, languages=['hi'])
        with open('tmp/transcript_hi.json', 'w', encoding='utf-8') as f:
            json.dump(transcript, f, ensure_ascii=False, indent=2)
        
        # Also save as plain text for easier reading
        full_text = " ".join([entry['text'] for entry in transcript])
        with open('tmp/transcript_hi.txt', 'w', encoding='utf-8') as f:
            f.write(full_text)
            
        print(f"Successfully extracted Hindi transcript for {video_id}")
    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python extract_transcript.py <video_id>")
    else:
        get_transcript(sys.argv[1])
