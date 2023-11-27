import uuid
import torch
from transformers import AutoModelForCausalLM, AutoTokenizer
from tqdm import tqdm
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import PyPDF2
from urllib.request import urlretrieve
from qdrant_client import models, QdrantClient
from sentence_transformers import SentenceTransformer
model = SentenceTransformer('sentence-transformers/all-mpnet-base-v2')
tokenizer = AutoTokenizer.from_pretrained('sentence-transformers/all-mpnet-base-v2') #use tokenizer to get number of inputs needed

qdrant = QdrantClient("localhost", port=6333)


# qdrant.delete(
#     collection_name="pdf_files",
#     points_selector=models.FilterSelector(
#         filter=models.Filter(
#             must=[
#                 models.FieldCondition(
#                     key="path",
#                     match=models.MatchValue(value='Thompson Sampling.pdf')
#                 ),
#             ],
#         )
#     ),
# )


found = False

for coll in qdrant.get_collections().collections:
    if coll.name == 'pdf_files':
        found = True
        break

if not found:
    qdrant.create_collection(
        collection_name="pdf_files",
        vectors_config=models.VectorParams(
            size=768,
            distance=models.Distance.COSINE,
        ),
    )

def gen_embedding(obj,emb_type='avg',obj_type='pdf'):
    txt = ''

    pages_remain = True
    i = 0
    if obj_type=='pdf':

        while pages_remain:
            try:
                txt += obj.pages[i].extract_text()
            except:
                pages_remain = False
            i+=1

        encoded_input = tokenizer(txt)

        if emb_type=='avg':

            num_embeddings = int(np.ceil(len(encoded_input[0]) / 256))

            results = []
            # print(txt)
            for embedding_idx in tqdm(range(num_embeddings)):
                tokens = {'input_ids':encoded_input['input_ids'][embedding_idx*256:embedding_idx*256+256],
                        }
                txt_small = tokenizer.decode(tokens['input_ids'])
                embedding = model.encode(txt_small)
                results.append(embedding)

            return np.mean(np.array(results),axis=0)

        else:
            tokens = {'input_ids':encoded_input['input_ids'][:256],
                        }
            txt_small = tokenizer.decode(tokens['input_ids'])

            embedding = model.encode(txt_small)
            return embedding


    else:
        embedding = model.encode(obj)

        return embedding

def add_doc(path,emb_type='avg',web=False,name=''):

    metadata = {

    "title": name,
        "path": path

    }


    if not web:
        path = 'public/docs/' + path


    if web:

        metadata = {

            "title": name,
            "path": name + '.pdf'

            }

        path = path.replace('-',r'/')

        urlretrieve(path, 'public/docs/'+ name + '.pdf')
        path = 'public/docs/'+ name + '.pdf'



    pdfFileObj = open(path, 'rb')
    pdf = PyPDF2.PdfReader(pdfFileObj)
    embedding = gen_embedding(pdf,emb_type)
    qdrant.upload_records(
    collection_name="pdf_files",
    records=[
        models.Record(
            id=str(uuid.uuid4()),vector = embedding,payload=metadata
        )
    ]
)

def search_docs(query):

    query_vector = gen_embedding(query,emb_type='first',obj_type='txt')

    results = qdrant.search(
        collection_name="pdf_files", query_vector = query_vector,
        limit=3
    )

    paths = []

    for r in results:
        paths.append([r.payload['title'],r.payload['path']])

    return paths