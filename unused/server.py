import json
import os, os.path
import random
import string
import inspect
import cherrypy

class Server(object):
    @cherrypy.expose
    def index(self):
        return open('index.html')

@cherrypy.expose
class Call(object):

    @cherrypy.tools.json_in()
    @cherrypy.tools.json_out()
    def PUT(self):
        req = cherrypy.request.json
        name = req['name']
        if not hasattr(Methods, name):
            return { 'error': 'no such method "%s"' % name }
        if 'params' in req:
            params = req['params']
        else:
            params = None
        response = getattr(Methods, name)(params)
        ret = {}
        if response != None:
            ret['response'] = response
        return ret



n = 0
records = {}

class Methods:
    def methods(params):
        ret = []
        for m in inspect.getmembers(Methods, inspect.isfunction):
            ret.append(m[0])
        return ret
    
    def add(params):
        global n
        global records
        ret = []
        for e in params:
            n = n + 1
            sn = str(n)
            records[sn] = e
            ret.append(sn)
        return ret

    def clear(params):
        global records
        records = {}

    def remove(keys):
        global records
        for key in keys:
            if key in records:
                del records[key]
            else:
                # this isn't right; it'll return the error as a response
                return { 'error': 'No such key "%s"' % key }

    def list(params):
        global records
        return records




if __name__ == '__main__':
    conf = {
        '/': {
            'tools.staticdir.root': os.path.abspath(os.getcwd())
        },
        '/Call': {
            'request.dispatch': cherrypy.dispatch.MethodDispatcher(),
            'tools.response_headers.on': True,
            'tools.response_headers.headers': [('Content-Type', 'application/json')],
        },
        '/static': {
            'tools.staticdir.on': True,
            'tools.staticdir.dir': './static'
        }
    }
    webapp = Server()
    webapp.Call = Call()
    cherrypy.quickstart(webapp, '/', conf)
