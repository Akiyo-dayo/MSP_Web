from http.server import HTTPServer, SimpleHTTPRequestHandler
import socket

def run_server():
    # 尝试不同的端口
    ports = [8080, 8000, 3000, 5000]
    
    for port in ports:
        try:
            server = HTTPServer(('localhost', port), SimpleHTTPRequestHandler)
            print(f"服务器成功启动在: http://localhost:{port}")
            print("按 Ctrl+C 停止服务器")
            server.serve_forever()
            break
        except socket.error as e:
            print(f"端口 {port} 启动失败: {e}")
            continue
        except Exception as e:
            print(f"发生其他错误: {e}")
            continue

if __name__ == '__main__':
    try:
        run_server()
    except KeyboardInterrupt:
        print("\n服务器已停止") 