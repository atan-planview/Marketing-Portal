import React, { Component } from 'react';
import { ImgComparisonSlider } from '@img-comparison-slider/react';
import 'img-comparison-slider/dist/collection/styles/initial.css';
import cookie from 'react-cookies'
const async = require('async');
const axios = require("axios")
// const hostname = "http://localhost:4000";
const hostname = "";
// console.log(process.env.ENV )

class CSC extends Component {
  constructor(props){
    super(props)
   this.state = {
     page: '',
     list: [],
     info: null,
     busy: false,
     is_done: false,
     is_preview: false,
     is_show_image: false,
     show_upload: false,
     showPrevious: false,
     hide_start: false,
     image_type: '',
     optimize: 0,
     pagination: [],
     paginationIndex: 1,
     search: '',
     s3: null,
     origin: {
       size: 0,
       src: ''
     },
     compress: {
       size: 0,
       src: ''
     }
   }
  }
  componentDidMount(){
    document.title = "CSC Image Optimizer"
  }
  pasteList(e){
    e.preventDefault()
    let clipboardData = e.clipboardData || window.clipboardData;
    let pastedData = clipboardData.getData('Text');
    pastedData = pastedData.split('\n').filter(item => item !== "")
    this.setState({
      list: pastedData.map(item => ({
        uri: item.replace(/(\r\n|\n|\r)/gm, ""),
        status: null,
        busy: false,
        option: 0,
        selected: false
      })),
      showPrevious: false
    })
  }
  closePreview(e){
    e.preventDefault()
    this.setState({
      is_preview: false,
      is_show_image: false
    })
  }
  setUploadItemOption(e, index){
    e.stopPropagation();
    let list = this.state.list, option = 0;
    if (list[index].has_resize){
      option = (++list[index]['option']) % 3
    }else{
      option = list[index].option === 0 ? 2 : 0
    }
    list[index]['option'] = option
    this.setState({
      list
    })
  }
  revertItemOption(e, index){
    e.stopPropagation();
    let list = this.state.list, option = 0;
    option = list[index].option === 0 ? 2 : 0
    list[index]['option'] = option
    this.setState({list})
  }
  openPreview(e, item){  
    // e.preventDefault();  
    // console.log(item)
    let that = this
    let list = this.state.list
    list.forEach(l => { 
      l.selected = (l.uri === item.uri)
    })
    this.setState({list})
    if (this.state.showPrevious) {
      axios.post(hostname + '/csc_api',{
        action: 'preview_original',
        item: item
      }).then(res => {        
        that.setState({
          info: item.info,
          s3: res.data.s3 + '/?revision=' + item.info['@revision'],
          is_preview: true
        })
      })

    }else{
      axios.post(hostname + '/csc_api',{
        action: 'preview',
        item: item
      }).then(res => {
        // console.log(res.data)
        list.forEach(el => {
          if (el.name === item.name){
            el['info'] = res.data.info
          }
        })
        if(res.data.is_error){
          that.setState({
            info: res.data.info,
            is_show_image: true,
            is_preview: true,
            img_src: res.data.src,
            list
          })
        }else{
          that.setState({
            info: res.data.info,
            origin: {
              src: hostname+( res.data.has_resize ? '/images/resize/' : '/images/origin/' )+res.data.name
            },
            compress: {
              src: hostname+'/images/compress/'+res.data.name
            },
            is_preview: true,
            is_show_image: false,
            list
          })
        }
      })
    }
  } 
  reset(){
    this.setState({
      list: [],
      is_preview: false,
      is_show_image: false,
      is_done: false,
      show_upload: false,
      showPrevious: false,
      page: ''
    })
  }
  download_compress(e){
    e.preventDefault()
    let tasks = [],
        that = this,
        list = this.state.list
    if (this.state.list.length > 0){

      
      this.state.list.forEach(item => {
        list.forEach(item => item.busy= true)
        this.setState({list})
        tasks.push( cb => {
          axios.post(hostname + '/csc_api',{
            action: 'download',
            url: item.uri
          }).then(res => {
            // console.log(res.status) 
            list.forEach(e => {
              if (e.uri === res.data.uri){
                e.status = res.status
                e.error = res.data.error
                e.busy = false
                if (res.status === 200) {
                  e.type = res.data.ret.algorithm
                  e.name = res.data.name
                  e.size_in = res.data.ret.size_in
                  e.size_out = res.data.ret.size_output
                  e.dimension = {
                    width: res.data.width,
                    height: Math.ceil(res.data.height)
                  }
                  e.has_resize = res.data.has_resize
                }
              }
            })
            that.setState({list, show_upload: true})
            
            cb(null, res.data)
          }).catch(err => {
            console.log(err)
            list.forEach(e => {
              if (e.option > 0){
                e.busy= false
              }
            })
            that.setState({list})
            cb(null, [])
          })
        })
      })
      async.parallel(tasks, (err, results) => {
        // console.log(200)
        this.setState({is_done: true, hide_start: true})
      })
    }
  }
  upload_cancel(e, is_upload){
    e.preventDefault()    
    if (is_upload){
      if (!window.confirm("Are you sure?")){
        // console.log(1)
        return;
      }
    }
    let tasks = [],
        that = this,
        list = this.state.list

    list.forEach(e => {
        e.busy= true
    })
    
    if (this.state.list.length > 0){
      this.state.list.forEach(item => {
        if (item.status === 200){
          item.busy = true
          this.setState({list})
          tasks.push( cb => {
            axios.post(hostname + '/csc_api',{
              action: 'upload',
              uri: item.uri,
              option: is_upload ? item.option : 0
            }).then(res => {
              list.forEach(e => {
                e.busy = false
                e.error = res.data.error
                if (e.uri === item.uri){
                  e.status = res.status === 200 ? 206 : 201
                }
              })
              that.setState({list})
              cb(null, res.data)
            }).catch(err => {
              list.forEach(e => {                
                  e.busy= false                
              })
              that.setState({list})
              cb(null, err)
            })
          })          
        }
      })
      async.parallel(tasks, (err, results) => {
        // console.log(results)
        this.setState({is_done: true, hide_start: false})
      })
    }
  }
  revert_revision(e){
    e.preventDefault()
    let tasks = [],
        that = this,
        list = this.state.list
    list.forEach(e => {
      if (e.option === 0){
        e.busy= true
      }
    })
    this.setState({list})
    if (this.state.list.length > 0){
      this.state.list.forEach(item => {
        if (item.option === 0 && item.status === 204){
          tasks.push( cb => {
            axios.post(hostname + '/csc_api',{
              action: 'revert',
              filename: item.name,
              uri: item.uri,
              revision: item.info['@revision']
            }).then(res => {
              list.forEach(e => {
                if (e.option === 0){
                  e.busy = false
                  e.option = 2
                  e.status = 206
                }
              })
              that.setState({list})
              cb(null, res.data)
            }).catch(err => {
              list.forEach(e => {
                if (e.option === 0){
                  e.busy= false
                }
              })
              that.setState({list})
              cb(null, err)
            })
          })          
        }
      })
      async.parallel(tasks, (err, results) => {
        // console.log(results)
        this.setState({is_done: true})
      })
    }
  }
  show_previous(e, index = 1){
    e.preventDefault()

    // console.log(this.state.search)
    let that =this
    this.setState({busy: true})
    axios.post(hostname + '/csc_api',{
      action: 'show',
      search: this.state.search,
      cursor: index
    }).then(res => {
      var list = res.data.list
      let pagination = [];
      for (let i=1; i <= Math.ceil(res.data.count / 20); i++) {
        pagination.push(i)
      }
      that.setState({
        list,
        showPrevious: true,
        busy: false,
        pagination,
        paginationIndex: index
      })
    })    
  }
  revision_change(e, item){
    // e.preventDefault()
    let list = this.state.list,
        that = this
    list.forEach(el => {
      if (el.uri === item.uri){
        el.info['@revision'] = e.target.value
      }
    })
    this.setState({list}, ()=> {
      if (that.state.is_preview){
        this.openPreview(e, item)
      }
    })
  }
  bytesToSize(bytes) {
    var sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    if (bytes == 0) return '0 Byte';
    var i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
    return Math.round(bytes / Math.pow(1024, i), 2) + ' ' + sizes[i];
  }
  page_change(e){
    this.setState({
      page: e.target.value
    })
  }
  crawl_page(e){
    e.preventDefault()
    if (this.state.page){
      let that =this
      this.setState({busy: true})
      axios.post(hostname + '/csc_api',{
        action: 'crawl',
        uri: this.state.page
      }).then(res => {
        // console.log(res.data)
        if(res.data && res.data.length > 0){
          that.setState({
            list: res.data.map(item => ({
              uri: 'https://success.planview.com' + item,
              status: null,
              busy: false,
              option: 0,
              selected: false
            })),
            showPrevious: false,
            busy: false
          })
        }else{
          that.setState({
            busy: false
          })
        }
      })
    }
  }
  logout(e){
    e.preventDefault()
    cookie.remove('pv-marketing', { path: '/' })
    window.location = '/login'
  }
  render() {
    return(
      <div className={`csc ${this.state.is_preview ? 'open': ''}`}>
        <div className="left">
          {
            this.state.list.length > 0 &&
            <>
              { !this.state.hide_start &&
                <button className="tertiary back dark" onClick={this.reset.bind(this)}>Start over</button>
              }
              <br />
              <br />
              <div>
                { !this.state.show_upload && !this.state.showPrevious &&
                  <button onClick={this.download_compress.bind(this)}>Download/Compress</button> 
                }
                {
                  this.state.show_upload && !this.state.showPrevious &&
                  <>
                    <button onClick={(e) => this.upload_cancel(e, false)} title="Flush temporary images and leave CSC as is">Cancel</button>&nbsp;
                    <button onClick={(e) => this.upload_cancel(e, true)}  title="Upload selected images to CSC">Upload</button>
                  </>
                }
                {
                  this.state.showPrevious &&
                  <button onClick={this.revert_revision.bind(this)}>Revert</button>
                }
              </div>
            </>
          }
          <div className={`list ${this.state.list.length > 0 ? 'active': ''}`}>
            {
              this.state.list.length == 0 &&
              <div className="menu">
                <button className="logout" onClick={this.logout}>Logout</button>
                <h2 className="l4-heading">Image Optimize Options</h2>
                <div className={`lds-ripple ${this.state.busy? 'active': ''}`}><div></div><div></div></div>
                <div  className="url">
                  <input type="url" placeholder="Listing images from this page URL" onChange={this.page_change.bind(this)} />
                  <button onClick={this.crawl_page.bind(this)}><i className="icon-long-arrow-right-regular"></i></button>
                </div>
                <span className="or">Or</span>
                <div className="paste" onPaste={this.pasteList.bind(this)} contentEditable={true} suppressContentEditableWarning={true}>Right click and paste your list here</div>
                <span className="or">Or</span>
                <div> <a href="#" onClick={this.show_previous.bind(this)} className="tertiary dark">Show previous compressed images (backup)</a></div>
              </div>
            }
            {
              this.state.list.length > 0 && this.state.showPrevious &&
              <div className="table-nav">
                <form onSubmit={(e) => this.show_previous(e, 1)}>
                  <input type="text" placeholder="Press ENTER to search" onChange={(e) => this.setState({search: e.target.value})} />
                </form>
                <ul className="pagination">
                  {
                    this.state.pagination.map(item => (
                      <li key={item} className={this.state.paginationIndex === item ? 'active': ''}><a href="#" onClick={(e) => this.show_previous(e, item)}>{item}</a></li>
                    ))
                  }
                </ul>
              </div>
            }
            {
              this.state.list.length > 0 &&
              <table>
                <thead>
                  <tr>
                    <th>_</th>
                    <th className="td-url">Image URL</th>
                    <th>Revision</th>
                    <th>Optimize Options</th>
                    <th>Type</th>
                    <th>Dimension</th>
                    <th>Size In</th>
                    <th>Size Out</th>
                  </tr>
                </thead>
                <tbody>
                  {
                    this.state.list.map((item, i) => (
                    <tr key={i} className={`${item.status === 200 || item.status === 204 ? 'is_good': ''} ${item.busy ? 'busy': ''} ${item.selected ? 'selected': ''}`}>
                      <td>
                        {
                          item.status !== 200 && item.status !== null && item.status !== 206 && item.status !== 204 && <span className="icon-close-x" title={item.error}></span>
                        }
                        {
                          item.status === null && <span className="icon-clock"></span>
                        }
                        {
                          item.status === 200 && <span className="icon-checkmark"></span>
                        }
                        {
                          item.status === 206 && <span className="icon-check-double-regular"></span>
                        }
                        {
                          item.status === 204 && <span className="icon-cloud-upload"></span>
                        }
                      </td>
                      <td className={`td-url ${item.status === 200 ? 'active' : ''}`} onClick={(e) => this.openPreview(e, item)}>
                        {item.uri}
                      </td>
                      <td>
                        {
                          item.status === 204 &&
                          <select className="revisions" onChange={(e) => this.revision_change(e, item)} defaultValue={item.info['@revision']}>
                            {
                              item.revisions.map(e => (
                                <option key={e}>{e + 1}</option>
                              ))
                            }
                          </select>
                        }
                        {
                          item.status === 200 && item.info &&
                          <span className="revisions">{item.info['@revision']}</span>
                        }
                      </td>
                      <td>
                        {
                          item.status === 200 && item.has_resize &&

                          <span className={`options ${item.option === 1 ? 'resize': (item.option === 2 ? 'compress' : '') }`} 
                          onClick={(e) => this.setUploadItemOption(e, i)}
                          title={item.option === 1 ? 'Resize': (item.option === 2 ? 'Compress/Resize' : 'Original') }
                          ></span>
                        }
                        {
                          item.status === 200 && !item.has_resize &&

                          <span className={`options ${item.option === 2 ? 'compress': '' }`} 
                          onClick={(e) => this.setUploadItemOption(e, i)}
                          title={item.option === 2 ? 'Compress' : 'Original' }
                          ></span>
                        }
                        {
                          item.status === 204 &&                          
                          <span className={`options ${item.option === 2 ? 'compress': '' }`} 
                            onClick={(e) => this.revertItemOption(e, i)}
                            title={item.option === 2 ? 'Compress' : 'Original' }
                            ></span>
                        }
                      </td>
                      <td>{item.status === 200 || item.status === 204 ? item.type : ''}</td>
                      <td>{item.status === 200 || item.status === 204 ? item.dimension.width +'X'+ item.dimension.height : ''}</td>
                      <td>{item.status === 200 || item.status === 204 ? this.bytesToSize(item.size_in) : ''}</td>
                      <td>{item.status === 200 || item.status === 204 ? this.bytesToSize(item.size_out) : ''}</td>
                    </tr>
                    ))
                  }
                </tbody>
              </table>
            }
            
          </div>
        </div>
        <div className="right">
          <button className="toggle" onClick={this.closePreview.bind(this)}><i className="icon-angle-right-regular"></i></button>
          {
            this.state.origin && this.state.compress && !this.state.showPrevious &&
            <>
              <div className="img-status">
                <span>After</span>
                <span>Before</span>
              </div>
              {
                this.state.info &&
                <div className="info">
                  <span><em>Name: </em>{this.state.info.filename}</span>
                  <span><em>Create: </em>{this.state.info['date.created']}</span>
                  <span><em>Modified: </em>{this.state.info['date.last-modified']}</span>
                  <span><em>Revision: </em>{this.state.info['@revision']}</span>
                  <span><em><a className="tertiary" href={this.state.info['page.parent']['uri.ui']} target="_blank">page</a></em></span>
                </div>
              }
              { this.state.is_show_image &&
                <img src={this.state.img_src} />
              }
              {
                !this.state.is_show_image &&
                <ImgComparisonSlider>
                  <img slot="before" src={this.state.origin.src} />
                  <img slot="after" src={this.state.compress.src} />
                </ImgComparisonSlider>
              }
            </>
          }          
          {
            this.state.showPrevious && this.state.info &&
            <>
              <div className="info">
                <span><em>Name: </em>{this.state.info.filename}</span>
                <span><em>Create: </em>{this.state.info['date.created']}</span>
                <span><em>Modified: </em>{this.state.info['date.last-modified']}</span>
                <span><em>Revision: </em>{this.state.info['@revision']}</span>
                <span><em><a className="tertiary" href={this.state.info['page.parent']['uri.ui']} target="_blank">page</a></em></span>
              </div>
              <img src={this.state.s3} />
            </>
          }
        </div>
      </div>
    );
  }
}
export default CSC;