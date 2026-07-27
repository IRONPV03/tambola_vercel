from flask import Flask, render_template, jsonify
import random

app = Flask(
    __name__,
    template_folder="../templates",
    static_folder="../static"
)

tambola_numbers = list(range(1, 91))
random.shuffle(tambola_numbers)

drawn_numbers = []


@app.route("/")
def home():
    return render_template("index.html")


@app.route("/tambola")
def tambola():

    if tambola_numbers:

        number = tambola_numbers.pop(0)

        drawn_numbers.append(number)

        return jsonify(
            {
                "number": number,
                "drawn_numbers": drawn_numbers,
            }
        )

    return jsonify(
        {
            "message": "Game Over!",
            "drawn_numbers": drawn_numbers,
        }
    )


if __name__ == "__main__":
    app.run()