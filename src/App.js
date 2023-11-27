import { React, useState } from "react";
import TextField from "@mui/material/TextField";
// import List from "../Components/List";
import "./App.css";
import Button from '@mui/material/Button';
import LoadingButton from '@mui/lab/LoadingButton';

const data = ['a','b']


function App() {

  const [urlVisible, setUrlVisible] = useState(false);
  const [uploadVisible, setFileUploadVisible] = useState(false);
  const [queryVal, updateQuery] = useState('');
  const [queryResults, updateResults] = useState({});
  const [fileName, updateFilePath] = useState('');
  const [uploadLoading, toggleUploadLoading] = useState(false);
  const [urlLoading, toggleUrlLoading] = useState(false);
  const [uploadStatus, updateUploadStatus] = useState('');
  const [uploadAddAvailStatus, updateUploadAddAvailStatus] = useState(true);
  const [urlAddAvailStatus, updateUrlAddAvailStatus] = useState(true);
  const [urlInput, updateUrlInput] = useState('');
  const [urlTitleInput, updateUrlTitleInput] = useState('');


  async function addDocument(path,name,type){

    if (type === 'local'){
      name = path.split('.')[0]
      }
    else {
      path = path.replace(/\//g, '-');

    }
    console.log('/add/' + type + '/'+path+'/'+name);
    const response = await fetch('/add/' + type + '/'+path+'/'+name);
    const data = await response.json()
    console.log(data);
    updateUploadStatus(data['status']);
    toggleUploadLoading(false);
    alert(data['status']);
  }

  // function UrlBox(){

  //   return (
  //     <div>
  //       <h4>URL</h4>
  //     <TextField onChange={getUrlInput} label="url" name='url' id='url'/>
  //     <h4>Title</h4>
  //     <TextField onChange={getUrlTitleInput} label="title" name='title' id='title'/>
  //     <LoadingButton disabled={urlAddAvailStatus} onClick={()=> {addDocument(urlInput,urlTitleInput,'web')}}>
  //       Add
  //     </LoadingButton>
  //     </div>

  //   )
  // }

  function LocalFilePrompt(){

    return(
      <form>
            <h4>Local File Upload</h4>
            <input name='file' type="file" onChange={getUploadedFilePath}/>
            <LoadingButton disabled={uploadAddAvailStatus} loading={uploadLoading} onClick={()=> {
              toggleUploadLoading(true);
              addDocument(fileName,'','local');
              }}>Upload</LoadingButton>
          </form>
    )
  }

  const getUploadedFilePath = (e) => {
    updateFilePath(e.target.files[0].name);
    updateUploadAddAvailStatus(false);

  }

  const getUrlInput = (e) => {
    // console.log(e.target.value);
    updateUrlInput(e.target.value);
  }

  const getUrlTitleInput = (e) => {
    updateUrlTitleInput(e.target.value);
    updateUrlAddAvailStatus(false);
  }

  const getSearchInput = (e) => {
    updateQuery(e.target.value);
  }

  async function sendQuery(query){
    console.log(query);
    const response = await fetch('/search/'+query);
    const data = await response.json();
    console.log(data);
    updateResults(data);
  }

  function List() {
    const paths = []

    for (var result in queryResults){

          paths.push([queryResults[result]['title'],queryResults[result]['path']]);

    }
    console.log(paths);

    return(
      <table><tr><th>Results</th></tr>

        {paths.map((path) => <tr><td><a href={path[0]}>{path[1]}</a></td></tr>)}

      </table>
)
}

  return (
    <div className="main">
      <h1>Vector Document Search</h1>
      <div className="search">
        <TextField
          onChange={getSearchInput}
          id="outlined-basic"
          variant="outlined"
          label="Find Document"
        />
      </div>
      <Button id="Search" variant="contained" onClick={( ) => { sendQuery(queryVal); }}>Search</Button>
      <List/>
      <Button onClick={() => {setFileUploadVisible(true);setUrlVisible(false);}} id="Add Document Local" variant="contained">Add Document (Local)</Button>
      <Button onClick={() => {setUrlVisible(true);setFileUploadVisible(false);}} id="Add Document URL" variant="contained">Add Document (URL)</Button>
      {urlVisible &&
      <div>
        <h4>URL</h4>
      <TextField onChange={getUrlInput} label="url" name='url' id='url'/>
      <h4>Title</h4>
      <TextField onChange={getUrlTitleInput} label="title" name='title' id='title'/>
      <LoadingButton loading={urlLoading} disabled={urlAddAvailStatus} onClick={()=> {
        toggleUrlLoading(true);
        addDocument(urlInput,urlTitleInput,'web')}}>
        Add
      </LoadingButton>
      </div>}

      {uploadVisible && <LocalFilePrompt/>}
    </div>

  );
}

export default App;