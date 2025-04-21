from flask import Flask, render_template, request, jsonify
from algorithms import bfs, dfs

app = Flask(__name__)

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/search", methods=["POST"])
def search():
    data = request.get_json()
    grid = data["grid"]
    start = tuple(data["start"])
    end = tuple(data["end"])
    algorithm = data.get("algorithm", "bfs")

    if algorithm == "dfs":
        visited, path = dfs.search(grid, start, end)
    else:
        visited, path = bfs.search(grid, start, end)

    return jsonify({"visited": visited, "path": path})

if __name__ == "__main__":
    app.run(debug=True)
