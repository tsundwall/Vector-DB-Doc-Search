from flask import Flask
import qdrant_methods as q


app = Flask(__name__)

@app.route('/add/<source>/<path>/<name>')

def add(path,source,name):

    if source =='local':
        print(path)
        # shutil.copyfile(source,'./public/doc')
        q.add_doc(path,emb_type='first',name=name)
    else:
        q.add_doc(path,emb_type='first',web=True,name=name)
    return {'status':'success'}


@app.route('/search/<query>')

def search(query):
    r = q.search_docs(query)
    json = {}
    for idx,i in enumerate(r):
        json[idx] = {}
        json[idx]['title'] = i[0]
        json[idx]['path'] = i[1]
    return json


if __name__ == '__main__':
    app.run(debug=True, port=3000)