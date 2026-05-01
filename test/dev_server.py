"""
로컬 개발 서버 - python test/dev_server.py 로 실행
http://localhost:3000?local=true 에서 게임 실행 (auth 없이)
"""
import http.server
import socketserver
import os

PORT = 3000
ROOT = os.path.join(os.path.dirname(__file__), '..')

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=ROOT, **kwargs)

    def log_message(self, format, *args):
        print(f"[{self.address_string()}] {format % args}")

if __name__ == '__main__':
    with socketserver.TCPServer(('', PORT), Handler) as httpd:
        print(f"✅ 서버 시작: http://localhost:{PORT}")
        print(f"🎮 로컬 모드: http://localhost:{PORT}?local=true")
        print("종료: Ctrl+C")
        httpd.serve_forever()
