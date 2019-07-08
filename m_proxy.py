from functools import wraps
from os import getenv

import requests
from bottle import cookie_decode
from flask import Flask, Response, make_response, request
from flask import Request
from libkrill.config import Config
from werkzeug.datastructures import Authorization

app = Flask(__name__)


def request_to_kiwi(kiwi_url, path, headers, query):
    r = requests.get("{}{}".format(kiwi_url, path), query, headers=headers)
    return r


def _kiwi_url(realm):
    kws_list = Config().kws_list
    default_kiwi = kws_list[0]['uri']
    kiwi_url = next((kws["uri"] for kws in kws_list if kws["realm"] == realm), default_kiwi)
    return kiwi_url


def shinken_login_required(handler):
    @wraps(handler)
    def wrapper(*args, **kwargs):
        req = request  # type: Request
        cookie = req.cookies.get("user", req.cookies.get("user_session"))
        decoded_cookie = cookie_decode(cookie, "CHANGEME")
        if not decoded_cookie or not decoded_cookie[-1]:
            return "Not authorized", 401
        req.authorization = Authorization("shinken-cookie", dict(username=decoded_cookie[-1]["login"]))
        return handler(*args, **kwargs)

    return wrapper


@app.route("/<path:path>")
@shinken_login_required
def proxy(path):
    req = request  # type: Request
    app.logger.error("user {} had requested /{}".format(req.authorization.username, path))

    realm = req.args.get("realm")
    kiwi_url = _kiwi_url(realm)
    headers = dict(req.headers)
    headers.pop("Host", '')
    headers.pop("Content-Length", '')
    args = dict(req.args)
    args.pop("realm")
    kiwi_response = request_to_kiwi(kiwi_url, path[4:], headers, args)

    response = make_response(kiwi_response.content)  # type: Response
    response.content_type = kiwi_response.headers["Content-Type"]
    response.status_code = kiwi_response.status_code
    return response


if __name__ == '__main__':
    app.run(getenv("HOST", "0.0.0.0"), getenv("PORT", 4258), debug=True)
