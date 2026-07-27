import json
import random
import string

from flask import Flask
from flask import jsonify
from flask import render_template
from flask import request
from flask import redirect

from api.redis_client import redis_client
from api.calls import CALLS

app = Flask(
    __name__,
    template_folder="../templates",
    static_folder="../static"
)


def generate_game_id():

    while True:

        game_id = "".join(
            random.choices(
                string.ascii_uppercase + string.digits,
                k=6
            )
        )

        if not redis_client.exists(f"game:{game_id}"):

            return game_id


def public_game(game):

    return {

        "game_id": game["game_id"],

        "remaining": len(game["remaining"]),

        "drawn": game["drawn"],

        "current": game["current"],

        "call": game["call"]

    }


@app.route("/")
def home():

    return redirect("/viewer")


@app.route("/viewer")
def viewer():

    return render_template("viewer.html")


@app.route("/game/<game_id>")
def join_game():

    return render_template(
        "viewer.html",
        game_id=game_id
    )

#updated
@app.route("/host")
def host():

    return render_template("host.html")


@app.route("/create", methods=["POST"])
def create():

    game_id = generate_game_id()

    host_token = "".join(
        random.choices(
            string.ascii_letters + string.digits,
            k=32
        )
    )

    numbers = list(range(1, 91))

    random.shuffle(numbers)

    game = {

        "game_id": game_id,

        "host_token": host_token,

        "remaining": numbers,

        "drawn": [],

        "current": None,

        "call": ""

    }

    redis_client.set(
        f"game:{game_id}",
        json.dumps(game)
    )

    return jsonify({

        "game_id": game_id,

        "host_token": host_token

    })


@app.route("/state/<game_id>")
def state(game_id):

    game = redis_client.get(f"game:{game_id}")

    if game is None:

        return jsonify({

            "error": "Game not found"

        }), 404

    game = json.loads(game)

    return jsonify(public_game(game))


@app.route("/draw", methods=["POST"])
def draw():

    body = request.json

    game_id = body["game_id"]

    token = body["host_token"]

    game = redis_client.get(f"game:{game_id}")

    if game is None:

        return jsonify({

            "error": "Game not found"

        }), 404

    game = json.loads(game)

    if token != game["host_token"]:

        return jsonify({

            "error": "Unauthorized"

        }), 403

    if len(game["remaining"]) == 0:

        return jsonify({

            "message": "Game Over"

        })

    number = game["remaining"].pop(0)

    game["drawn"].append(number)

    game["current"] = number

    game["call"] = CALLS[number]

    redis_client.set(

        f"game:{game_id}",

        json.dumps(game)

    )

    return jsonify(public_game(game))


@app.route("/reset", methods=["POST"])
def reset():

    body = request.json

    game_id = body["game_id"]

    token = body["host_token"]

    game = redis_client.get(f"game:{game_id}")

    if game is None:

        return jsonify({

            "error": "Game not found"

        }), 404

    game = json.loads(game)

    if token != game["host_token"]:

        return jsonify({

            "error": "Unauthorized"

        }), 403

    numbers = list(range(1, 91))

    random.shuffle(numbers)

    game["remaining"] = numbers

    game["drawn"] = []

    game["current"] = None

    game["call"] = ""

    redis_client.set(

        f"game:{game_id}",

        json.dumps(game)

    )

    return jsonify({

        "message": "Reset Successful"

    })


if __name__ == "__main__":

    app.run(debug=True)