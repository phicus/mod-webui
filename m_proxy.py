from bottle import cookie_decode
from flask import Flask, Response, make_response, request
from flask import Request
from requests import Response

app = Flask(__name__)

import requests


def kiwi_api_proxy(path, port=4280):
    kiwi_url = "http://localhost:{}/{}".format(port, path)
    print(kiwi_url)
    r = requests.get(kiwi_url)
    if r.status_code != 200:
        raise Exception("API error")
    return r


@app.route("/<path:path>")
def proxy(path):
    req = request  # type: Request
    cookie = cookie_decode(req.cookies["user"], "CHANGEME")
    print(cookie)
    if not cookie[-1]:
        return "Not authorized", 401
    kiwi_response = kiwi_api_proxy(path)
    response = make_response(kiwi_response.content)  # type: Response
    response.content_type = kiwi_response.headers["Content-Type"]
    response.status_code = kiwi_response.status_code
    return response


app.run("localhost", 4258)
