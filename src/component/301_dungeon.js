import React, { Component } from 'react';
import Dropzone from 'react-dropzone';
import csv from 'csv';
const axios = require("axios")
const validUrl = require('valid-url');
const async = require('async');
const hostname = "";

class Dungeon301 extends Component {
  constructor(props){
    super(props)
    this.state = {
      list: [],
      site: 'www.planview.com'
    }
  }
  onDrop(e) {
    const reader = new FileReader();
    reader.onload = () => {
      csv.parse(reader.result, (err, data) => {
        let sources = data.flat(1);
        let tasks = [];
        sources.forEach((item) => {
          if (validUrl.isUri(item)){ 
            tasks.push( cb => {
              axios.post(hostname + '/301Dungeon',{
                site: this.state.site,
                source: item
              }).then(res => {
                let newList = this.state.list
                newList.push(res.data)
                this.setState({
                  list: newList
                })
                cb(null, res.data)
              })
            })
          }else{            
            this.props.notification('warning', 'Invalid '+ item)
          }
        });
        async.parallel(tasks, (err, results) => {
          if (results.length > 0)
            this.props.notification('success', 'Verify complete!')
        })
      })
    };
    reader.readAsBinaryString(e[0]);
  }
  setSite(e){
    this.setState({site: e.target.value})
  }
  render() {
    return(
      <div className="dungeon">
        <div className="main">
          <h3 className="l3-heading">301 Dungeon</h3>
          <ul className="sites" onChange={this.setSite.bind(this)}>
            <li><input type="radio" value="www.planview.com" name="sites" defaultChecked id="rdPlanview" /> <label htmlFor="rdPlanview">www.planview.com</label></li>
            <li><input type="radio" value="blog.planview.com" name="sites" id="rdBlog"/> <label htmlFor="rdBlog">blog.planview.com</label></li>
          </ul>
          <div className="dropZone">
            <Dropzone onDrop={this.onDrop.bind(this)}> 
            {({getRootProps, getInputProps}) => (
              <section>
                <div {...getRootProps()}>
                  <input {...getInputProps()} />
                  <p>
                    Drag 'n' drop some files here, or click to select files
                    <img src="./drag-and-drop-icon.png" alt="" />
                  </p>
                </div>
              </section>
            )}
            </Dropzone>
          </div>
          <table className="list">
            <thead>
              <tr>
                <th>Source</th>
                <th>Redirect</th>
                <th>Pages</th>
              </tr>
            </thead>
            <tbody>
              {
                this.state.list.map( (item,index) => (
                  <tr key={index} className={item.status === 301 ? '' : 'no-good'}>
                    <td>{item.source}</td>
                    <td>{item.redirect}</td>
                    <td>{item.success}</td>
                  </tr>
                ))
              }
            </tbody>
          </table>
        </div>
      </div>
    );
  }
}
export default Dungeon301;