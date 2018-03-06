#!/usr/bin/env python

"""
This is a simple HTTP server.
Run this server in the same folder as the html files to access.
Extend the handler class to intercept GET request if required so the server
acts as proxy to retrieve records from elsewhere.
"""
 
from http.server import SimpleHTTPRequestHandler, BaseHTTPRequestHandler, HTTPServer
import requests, json, sys
import webbrowser

PORT = 8080
#URL = "http://192.168.163.133:8080/simpleswitch/mactable/0000000000000001"
URL2 = "http://127.0.0.1:8080" #"http://192.168.2.231:8080" #"http://192.168.163.133:8080" #
path = "monitor"

# HTTPRequestHandler class
class ProxyRequestHandler(SimpleHTTPRequestHandler):
	# GET
	def do_GET(self):
		if(self.path.startswith("/stats")):
			try:
				r = requests.get(URL2+self.path)
				self.send_response(r.status_code)
				self.send_header('Content-type',r.headers['content-type'])
				self.end_headers()
				self.wfile.write(bytes(r.text,'utf8'))
			except requests.exceptions.ConnectionError:
				self.send_response(503)
				self.send_header('Content-type','text/html')
				self.end_headers()
				self.wfile.write('<p>ConnectionError! Check URL and try again.</p>'.encode('utf-8'))
		else:
			SimpleHTTPRequestHandler.do_GET(self) # replace with return if BaseHTTPRequestHandler is extended

	def do_POST(self):
		if(self.path.startswith("/stats")):
			try:
				length = int(self.headers['Content-Length'])
				s = self.rfile.read(length).decode('utf-8')			
				r = requests.post(URL2+self.path, s)
				self.send_response(r.status_code)
				self.send_header('Content-type',r.headers['content-type'])
				self.end_headers()
				self.wfile.write(bytes(r.text,'utf8'))
			except requests.exceptions.ConnectionError:
				self.send_response(503)
				self.send_header('Content-type','text/html')
				self.end_headers()
				self.wfile.write('<p>ConnectionError! Check URL and try again.</p>'.encode('utf-8'))
		else:
			SimpleHTTPRequestHandler.do_POST(self) # replace with return if BaseHTTPRequestHandler is extended
			
def main():
	total = len(sys.argv)
	cmdargs = str(sys.argv)
	if(len(sys.argv)>=2):
		global URL2
		URL2 = sys.argv[1];
	
	print("Using : ", URL2);
	print('starting server...')

	# Local Server settings
	server_address = ('', PORT)
	httpd = HTTPServer(server_address, ProxyRequestHandler)
	print('running server...')
	webbrowser.open_new('http://localhost:%s/%s'%(PORT,path))
	httpd.serve_forever()
	

if __name__ == '__main__':
	main()
