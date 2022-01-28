import React, { Component } from 'react';
import cookie from 'react-cookies'
import {NotificationContainer, NotificationManager} from 'react-notifications';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import Dropzone from 'react-dropzone';

const axios = require("axios")
// const hostname = "http://localhost:4000";
const hostname = "";
const outline = `<div><h1>TITLE (H1)</h1><h2>SUBTITLE (H2)</h2><h4>SUBTITLE (H4)</h4><p><strong>Intro</strong></p><p><br></p><p><strong>Body</strong></p><p><em>Section 1</em></p><p><br></p><p><em>Section 2</em></p><p><br></p><p><em>Section 3</em></p><p><br></p><p><em>Conclusion</em></p></div>`
const s3_server = 'https://csc-images.s3-us-west-2.amazonaws.com/'
class ContentBrief extends Component {
  constructor(props){
    super(props)
    this.state = {
      showDoc: false,
      showHome: false,
      showUser: false,
      is_article: false,
      is_collpase: [],
      step_close: [false, false, true, true, true, true, true],
      is_set_pin: false,
      users: [],
      user:{},
      doc_open: false,
      is_dropzone_open: false,
      drop_file: null,
      fileNote: '',
      busy: false,
      briefs: [],
      cursor: 0,
      pagesize: 18,
      count: 0,
      query: '',
      instruction: '',
      editor: {
        html: '',
        target: null,
        is_open_editor: false
      },
      doc:{
        id: 0,
        data:{
          attachments: []
        }
      }
    }
  }
  componentDidMount(){
    // console.log(window.location)
    let user = cookie.load('pv-marketing')
    this.setState({user})
    if (window.location.pathname.indexOf('/users') >= 0){
      document.title = "Users | Planview"
      this.list_users()
    }else if (window.location.pathname.indexOf('/user/') >= 0){
      document.title = "User Signup | Planview"
      const {token} = this.props.match.params
      let that =this
      if (token){
        axios.post(hostname + '/user',{
          action: 'verify',
          token
        }).then(res => {      
          // console.log(res.data)  
          if(res.status == 200){
            this.setState({
              user: res.data,
              is_set_pin: true, 
              showUser: false,
              showDoc: false,
              showHome: false
            })
          }
        })
      }
    }else{
      document.title = "Content Brief | Planview"
      const {id} = this.props.match.params
      if (id){
        this.get_instruction();
        this.get_a_brief(id)                  
      }else{
        this.list_brief()
      }
    }
  }
  get_instruction(){
    let that = this
    axios.post(hostname + '/brief',{
      action: 'get-instruction'
    }).then(res => {        
      that.setState({instruction: res.data})
    }).catch(err => {      
      console.log(err)
    })
  }
  collapse(e, index){
    let is_collpase = this.state.is_collpase
    is_collpase[index] = !this.state.is_collpase[index]
    this.setState({is_collpase})
  }
  close_step(e, index){
    let step_close = this.state.step_close
    step_close[index] = !this.state.step_close[index]
    this.setState({step_close})
  }
  handle_change(e, type){
    let user = this.state.user
    user[type] = e.target.value
    this.setState({user})
  }
  open_doc(e){
    e.preventDefault()
    this.setState({doc_open: !this.state.doc_open})
  }
  close_dropzone(e){
    e.preventDefault()
    this.setState({is_dropzone_open: false})
  }
  open_dropzone(e){
    e.preventDefault()
    this.setState({is_dropzone_open: true})
  }
  uploadFile (e){
    e.preventDefault()
    let that = this
    let user = cookie.load('pv-marketing')
    let doc = this.state.doc
    this.setState({busy: true})
    const formData = new FormData();        
    formData.append('file', this.state.drop_file); // appending file
    axios.post(hostname + '/brief-upload', formData).then(res => {
      if (res.status === 200) {
        doc.data.attachments = doc.data.attachments || []
        doc.data.attachments.unshift({
          date: (new Date()).toLocaleDateString('en-US'),
          note: that.state.fileNote,
          link: s3_server + res.data,
          name: res.data,
          user: user.name
        })
        that.setState({
          doc,
          is_dropzone_open: false,
          busy: false,
          drop_file: null,
          fileNote: ''
        })
        this.save_brief()
      }else{
        this.setState({busy: false})
      }
    }).catch(err => this.setState({busy: false}))
  }
  delete_file(e, item){
    let that = this
    let doc = this.state.doc
    that.setState({busy: true})
    axios.post(hostname + '/brief',{
      action: 'delete-file',
      filename: item.name
    }).then(res => {        
      if(res.status === 200){
        this.createNotification('succes','attachemt deleted!')
        doc.data.attachments = doc.data.attachments.filter(el => el.name !== item.name)
        that.setState({
          busy: false,
          doc
        })
      }
      that.setState({busy: false})
    }).catch(err => {      
      that.setState({busy: false})
    })
  }
  handleFileChange(e){
    // console.log(e.target.files[0])
    this.setState({drop_file: e.target.files[0]});
  }
  fileNoteChange(e){
    this.setState({
      fileNote: e.target.value
    })
  }
  create_brief(e){
    e.preventDefault()
    let timestamp = new Date().getTime().toString()
    window.location = '/content-brief/'+timestamp
  }
  save_brief(e){
    this.setState({busy: true})
    let that = this,
    briefs = this.state.briefs,
    doc = this.state.doc
    // doc['timestamp'] = doc.id
    axios.post(hostname + '/brief',{
      action: 'save',
      doc
    }).then(res => {        
      if(res.status === 200){
        this.createNotification('success','Saved!')
      }else{
        this.createNotification('error','Not Saved!')
      }
      that.setState({busy: false, briefs})
    }).catch(err => {      
      that.setState({busy: false})
      this.createNotification('error','Not Saved!')
    })
  }
  delete_brief(e){
    e.preventDefault()
    if (window.confirm('Are you sure you want to delte?')){

      this.setState({busy: true})
      let that = this
      axios.post(hostname + '/brief',{ 
        action: 'delete',
        doc: this.state.doc
      }).then(res => {        
        if(res.status === 200){
          window.location = '/content-brief'
        }
        // that.setState({busy: false, briefs: res.data})
      }).catch(err => {      
        that.setState({busy: false})
        this.createNotification('error','Not Deleted!')
      })
    }
  }
  handle_doc_change(e, target, type){
    let doc = this.state.doc
    if (type.indexOf('radio') >= 0){
      let alt = type.split('->')[1]
      doc.data[alt] = false
      doc.data[target] = true
    }else{
      switch (type){
        case 'chk':
          doc.data[target] = !doc.data[target]
          break
        case 'other':
          doc.data[target] = e.target.value || false
        default:
          doc.data[target] = e.target.value
      }
    }
    this.setState({doc})
  }
  editor_handle_change(value){
    let editor = this.state.editor
    editor['html'] = value
    this.setState({editor})
  }
  editor_handle_save(e){
    this.handle_doc_change(e, this.state.editor.target, 'html')
    let doc = this.state.doc
    let editor = this.state.editor
    editor.is_open_editor= false
    doc.data[editor.target] = editor.html
    this.setState({editor, doc})
  }
  editor_handle_carryover(e){
    this.handle_doc_change(e, this.state.editor.target, 'html')
    let doc = this.state.doc
    let editor = this.state.editor
    editor.is_open_editor= false
    doc.data[editor.target] = editor.html
    let that = this
    axios.post(hostname + '/brief',{
      action: 'save-instruction',
      data: editor.html
    }).then(res => {        
      that.setState({editor, doc})
    }).catch(err => {      
      console.log(err)
    })
  }
  open_editor(target){
    let editor = this.state.editor
    editor['html'] = this.state.doc.data && this.state.doc.data[target] ? 
                      this.state.doc.data[target] : target === '2_14_1' ? 
                      this.state.instruction : target === '7_1_1' ? outline : ''
    editor['target'] = target
    editor.is_open_editor= true
    this.setState({editor})
  }
  editor_handle_cancel(){
    let editor = this.state.editor
    editor.is_open_editor= false
    this.setState({editor})
  }
  go_home(e){
    window.location = "/content-brief"
    this.list_brief(e)
  }
  get_a_brief(id){
    let that = this
    // let user = cookie.load('pv-marketing')
    that.setState({busy: true})
    axios.post(hostname + '/brief',{
      action: 'get-single',
      id
    }).then(res => {        
      // console.log(res.data)
      if(res.status === 200){
        that.setState({
          is_set_pin: false,
          showUser: false,
          showDoc: true,
          showHome: false,
          busy: false,
          doc: res.data
        }, () => {
          if (!that.isTimestamp(id)){
            this.createNotification('error','Invalid brief id '+ id)
          }
        })
      }
      that.setState({busy: false})
    }).catch(err => {      
      that.setState({busy: false})
    })
  }
  list_brief(e, is_load= false){
    if (e)
      e.preventDefault()
    let that = this,
        briefs = this.state.briefs
    
    that.setState({busy: true})
    let startKey = is_load ? this.state.cursor + 1 : 1
    axios.post(hostname + '/brief',{
      action: 'get',
      size: this.state.pagesize,
      startKey,
      query: this.state.query
    }).then(res => {      
      if(res.status === 200){
        // console.log(res.data)
        briefs = is_load ? briefs.concat(res.data.briefs) : res.data.briefs
        that.setState({
          is_set_pin: false,
          showUser: false,
          showDoc: false,
          showHome: true,
          busy: false,
          briefs,
          cursor: startKey,
          count: res.data.count
        })
      }else{
        that.setState({
          is_set_pin: false,
          showUser: false,
          showDoc: false,
          showHome: true,
          busy: false,
          cursor: false
        })
      }
    }).catch(err => {      
      that.setState({busy: false})
    })
  }
  list_users(){
    let that = this
    axios.post(hostname + '/user',{
      action: 'list'
    }).then(res => {      
      if(res.status === 200){
        let users = res.data
        that.setState({
          showUser: true,
          showDoc: false,
          showHome: false,
          showListUser: true,
          busy: false,
          users
        })
      }
    }).catch(err => {      
      that.setState({busy: false})
    })
  }
  open_user(e){
    e.preventDefault()
    window.location = 'users/'
  }
  handle_user_submit(e){
    e.preventDefault()
    let that = this
    if(this.state.user.email){
      axios.post(hostname + '/user',{
        action: 'create',
        user: this.state.user
      }).then(res => {        
        if(res.status == 200){
          let user = that.state.user
          user['token'] = res.data.token
          that.setState({user})
        }
      })
    }else{
      if(this.state.user.name, this.state.user.password){
        let user = this.state.user
        user['name'] = this.state.user.name
        user['password'] = this.state.user.password
        axios.post(hostname + '/user',{
          action: 'signup',
          user: this.state.user
        }).then(res => {        
          if(res.status == 200){
            let user = res.data
            user['is_singup'] = true
            that.setState({user})
          }
        })
      }
    }
  }
  create_user(e){
    e.preventDefault()
    this.setState({
      user: {},
      show_createUser: true,
      showListUser: false
    })
  }
  reset_user(e, item){
    e.preventDefault()
    this.setState({
      user: {
        email: item.id,
        role: item.user.role
      },
      show_createUser: true,
      showListUser: false
    })
  }
  delete_user(e, item){
    let that = this
    axios.post(hostname + '/user',{
      action: 'del',
      user: item
    }).then(res => {      
      if(res.status === 200){
        let users = res.data
        // console.log(users)
        that.setState({
          showListUser: true,
          busy: false,
          users
        })
      }
    }).catch(err => {      
      that.setState({busy: false})
    })
  }
  logout(e){
    e.preventDefault()
    cookie.remove('pv-marketing', { path: '/' })
    window.location = '/login'
  }
  _date(timestamp) {
    return (new Date(parseInt(timestamp))).toDateString()
  }
  createNotification = (type, message) => {
    switch (type) {
      case 'info':
        NotificationManager.info('Info message');
        break;
      case 'success':
        NotificationManager.success( message, 'Brief');
        break;
      case 'warning':
        NotificationManager.warning( message, 'Warning', 3000);
        break;
      case 'error':
        NotificationManager.warning( message, 'Error', 3000);
        break;
      }
  }
  onDrop(files, target){
    let doc = this.state.doc
    let that = this
    var formData = new FormData();
    formData.append('file', files[0]);
    that.setState({busy: true})
    axios.post(hostname + '/brief', formData, {
      headers: {
        action: 'upload-image',
        filename: doc.id+'_'+target
      }
    }).then(res => {
      if (res.status === 200){
        doc.data[target] = s3_server+res.data
        that.setState({doc, busy: false})
      }else{
        that.setState({busy: false})
      }
    }).catch(err => this.setState({busy: false}))
  }
  clear_image(target){
    let doc = this.state.doc
    doc.data[target] = ''
    this.setState({doc})
  }
  isTimestamp(n) {
    const parsed = parseFloat(n);  
    return !Number.isNaN(parsed) && Number.isFinite(parsed) && /^\d+\.?\d+$/.test(n);
  }
  render() {
    const state = this.state
    return(
      <section className="content-brief">
        <aside>
          <img className={`logo ${state.busy ? 'busy': ''}`} src="https://media.planview.com/favicon/favicon-32x32.png" />
          <div className="action">
            {
              !state.is_set_pin &&
              <>
                <button className={state.showHome ? `active` : ``} onClick={this.go_home.bind(this)}><i className="icon-home"></i></button>
                <button className={`disable ${state.showDoc && !state.doc_open ? `active` : ``}`}><i className="icon-doc"></i></button>
                {
                  state.showDoc &&
                  <button className={`level-2 btn-upload ${state.doc_open? 'active' : ''}`} onClick={this.open_doc.bind(this)}><i className="icon-paper-clip"></i></button>
                }
              </>
            }
            {
              state.user && state.user.role !== 'author-brief' &&
              <button className={state.showUser || state.is_set_pin ? `active` : ``} onClick={this.open_user.bind(this)}><i className="icon-users-regular"></i></button> 
            }
            <button className="logout" onClick={this.logout.bind(this)}><i className="icon-logout"></i></button>
          </div>
        </aside>
        <main className={`${state.doc_open? 'open' : ''} ${state.editor['is_open_editor'] ? 'open-editor': ''}`}>
          {
            state.showHome &&
            <section className="home">
              <form className="search" onSubmit={(e) => this.list_brief(e)}>
                <input type="search"
                  // value={state.search}
                  onChange={(e) => this.setState({query: e.target.value})}
                />
              </form>
              <ul className="briefs">
                {
                  state.briefs.map((item, i) => (
                    <li key={i}>
                      <div className="card">                        
                        <strong>{item.brief.title}</strong>
                        <time>Last updated<br/>{this._date(item.brief.timestamp)}</time>
                        <a className="header" href={`/content-brief/${item.id}`}><i className="icon-eye"></i></a>
                        {
                          item.brief.is_attachment &&
                          <i className="icon-paper-clip"></i>
                        }
                      </div>
                    </li>
                  ))
                }
                {
                  state.user.role !== 'author-brief' &&
                  <li>
                    <div className="card new">
                      <strong>New Content Brief</strong>
                      <button className="add-new header" onClick={this.create_brief.bind(this)}><i className="icon-plus1"></i></button>
                    </div>
                  </li>
                }
              </ul>
              {
                (state.cursor * state.pagesize) < state.count &&
                <button className="load-more" onClick={(e) => this.list_brief(e, true)}>Load More<br/>
                  <small>({state.briefs.length} of {state.count})</small>
                </button>
              }
            </section>
          }
          {
            state.showDoc && 
            <>
              <div className="upload">
                <ul className="attachments">
                  <li>
                    <button className="btn-add-attachment" onClick={this.open_dropzone.bind(this)}><i className="icon-plus-circle-light"></i> Add new</button>
                  </li>  
                  { state.doc.data.attachments &&
                    state.doc.data.attachments.map((item, i) => (
                      <li key={i}>
                        <strong>By {item.user}</strong><time>{item.date}</time>
                        {
                          state.user.name === item.user &&
                          <button className="btn-delete" onClick={(e) => this.delete_file(e, item)}><i className="icon-close1"></i></button>
                        }
                        { item.note &&
                          <div className="note">{item.note}</div>
                        }
                        <a href={item.link} download>{item.name}</a>
                      </li>
                    ))
                  }
                </ul>
                <div className={`file-upload ${state.is_dropzone_open? 'open': ''}`}>
                  <div className="inner">
                    <button className="btn-close" onClick={this.close_dropzone.bind(this)}><i className="icon-close-x"></i></button>
                    <label className="custom-file-upload">
                      <input type="file" onChange={this.handleFileChange.bind(this)} accept=".doc,.docx" />    
                      { !state.drop_file &&
                        <>
                          Drag 'n' drop some files here, or click to select files
                          <br/><i className="icon-envelope-letter"></i> 
                        </>
                      }
                      {
                        state.drop_file &&
                        <span>{state.drop_file.name}</span>
                      }
                    </label>
                    <label>Note:</label>
                    <textarea className="note" onChange={this.fileNoteChange.bind(this)} value={state.fileNote}></textarea>
                    <button onClick={this.uploadFile.bind(this)} className="button primary dark">Upload</button>
                  </div>
                </div>
              </div>
              <section className={`doc ${state.user.role}`}> 
                <NotificationContainer/>
                <div className={`editor`}>
                  <ReactQuill value={this.state.editor.html}
                    onChange={(value) => this.editor_handle_change(value)} />
                  <br/>
                  {
                    state.editor.target === '2_14_1' &&
                    <>
                      <button onClick={this.editor_handle_carryover.bind(this)}>Save/Carry Over</button> &nbsp; 
                    </>
                  }
                  <button onClick={this.editor_handle_save.bind(this)}>Save</button> &nbsp; 
                  <button onClick={this.editor_handle_cancel.bind(this)}>Cancel</button>
                </div>
                <button className="btn-back" onClick={this.open_doc.bind(this)}><i className="icon-angle-left-regular"></i></button>
                <div className="title">
                  <input type="text" placeholder="Content Brief Title" maxLength={50}
                    onChange={(e) => this.handle_doc_change(e, 'title', 'text')} readOnly={state.user.role === 'author-brief'} value={state.doc.data ?  state.doc.data['title'] : ''} />
                </div>
                <ul className="collaptable">
                  <li className={`step-blue ${state.step_close[0] ? 'close': ''}`}>
                    <legend onClick={(e) => this.close_step(e, 0)}>Step 1: Select Asset Type</legend>
                    <div className={`row ${state.is_collpase[0] ? 'collapse': ''}`}>
                      <div className="directive">
                        <strong>Asset Type:</strong>
                        <button className="toggle" onClick={(e) => this.collapse(e, 0)}><i className="icon-arrow-up-circle"></i></button>
                      </div>
                      <div className="content">
                          <span className={`chk ${state.doc.data && state.doc.data['1_1_1'] ? 'checked': ''}`} onClick={(e) => this.handle_doc_change(e, '1_1_1', 'chk')}>Blog</span>
                          <span className={`chk ${state.doc.data && state.doc.data['1_1_2'] ? 'checked': ''}`} onClick={(e) => this.handle_doc_change(e, '1_1_2', 'chk')}>SEO Article</span>
                          <span className={`chk ${state.doc.data && state.doc.data['1_1_3'] ? 'checked': ''}`} onClick={(e) => this.handle_doc_change(e, '1_1_3', 'chk')}>SEO Guide</span>
                          <span className={`chk ${state.doc.data && state.doc.data['1_1_4'] ? 'checked': ''}`} onClick={(e) => this.handle_doc_change(e, '1_1_4', 'chk')}>Registration Page</span>
                          <span className={`chk ${state.doc.data && state.doc.data['1_1_5'] ? 'checked': ''}`} onClick={(e) => this.handle_doc_change(e, '1_1_5', 'chk')}>Story Page</span>
                          <span className={`chk ${state.doc.data && state.doc.data['1_1_6'] ? 'checked': ''}`} onClick={(e) => this.handle_doc_change(e, '1_1_6', 'chk')}>Web Page</span>
                          <span className={`chk ${state.doc.data && state.doc.data['1_1_7'] ? 'checked': ''}`} onClick={(e) => this.handle_doc_change(e, '1_1_7', 'chk')}>Analyst Report</span>
                          <span className={`chk ${state.doc.data && state.doc.data['1_1_8'] ? 'checked': ''}`} onClick={(e) => this.handle_doc_change(e, '1_1_8', 'chk')}>Benchmark Report</span>
                          <span className={`chk ${state.doc.data && state.doc.data['1_1_9'] ? 'checked': ''}`} onClick={(e) => this.handle_doc_change(e, '1_1_9', 'chk')}>Buyer's Guide</span>
                          <span className={`chk ${state.doc.data && state.doc.data['1_1_10'] ? 'checked': ''}`} onClick={(e) => this.handle_doc_change(e, '1_1_10', 'chk')}>Case Study</span>
                          <span className={`chk ${state.doc.data && state.doc.data['1_1_11'] ? 'checked': ''}`} onClick={(e) => this.handle_doc_change(e, '1_1_11', 'chk')}>Datasheet</span>
                          <span className={`chk ${state.doc.data && state.doc.data['1_1_12'] ? 'checked': ''}`} onClick={(e) => this.handle_doc_change(e, '1_1_12', 'chk')}>Corporate Brochure</span>
                          <span className={`chk ${state.doc.data && state.doc.data['1_1_13'] ? 'checked': ''}`} onClick={(e) => this.handle_doc_change(e, '1_1_13', 'chk')}>eBook</span>
                          <span className={`chk ${state.doc.data && state.doc.data['1_1_14'] ? 'checked': ''}`} onClick={(e) => this.handle_doc_change(e, '1_1_14', 'chk')}>Executive Brief</span>
                          <span className={`chk ${state.doc.data && state.doc.data['1_1_15'] ? 'checked': ''}`} onClick={(e) => this.handle_doc_change(e, '1_1_15', 'chk')}>Infographic</span>
                          <span className={`chk ${state.doc.data && state.doc.data['1_1_16'] ? 'checked': ''}`} onClick={(e) => this.handle_doc_change(e, '1_1_16', 'chk')}>Info Sheet</span>
                          <span className={`chk ${state.doc.data && state.doc.data['1_1_17'] ? 'checked': ''}`} onClick={(e) => this.handle_doc_change(e, '1_1_17', 'chk')}>Product Demo</span>
                          <span className={`chk ${state.doc.data && state.doc.data['1_1_18'] ? 'checked': ''}`} onClick={(e) => this.handle_doc_change(e, '1_1_18', 'chk')}>Solution Brief</span>
                          <span className={`chk ${state.doc.data && state.doc.data['1_1_19'] ? 'checked': ''}`} onClick={(e) => this.handle_doc_change(e, '1_1_19', 'chk')}>Solution Demo</span>
                          <span className={`chk ${state.doc.data && state.doc.data['1_1_20'] ? 'checked': ''}`} onClick={(e) => this.handle_doc_change(e, '1_1_20', 'chk')}>Video</span>
                          <span className={`chk ${state.doc.data && state.doc.data['1_1_21'] ? 'checked': ''}`} onClick={(e) => this.handle_doc_change(e, '1_1_21', 'chk')}>Webinar</span>
                          <span className={`chk ${state.doc.data && state.doc.data['1_1_22'] ? 'checked': ''}`} onClick={(e) => this.handle_doc_change(e, '1_1_22', 'chk')}>Whitepaper</span>
                          <span className={`chk has-input ${state.doc.data && state.doc.data['1_1_23'] ? 'checked': ''}`}>
                            Other 
                            <input type="text" onChange={(e) => this.handle_doc_change(e, '1_1_23', 'other')} value={state.doc.data ? state.doc.data['1_1_23'] : ''} readOnly={state.user.role === 'author-brief'} />
                          </span>
                      </div>
                    </div>
                  </li>
                  <li className={`step-green ${state.step_close[1] ? 'close': ''}`}>
                    <legend onClick={(e) => this.close_step(e, 1)}>Step 2: Provide SEO Details</legend>
                    <div className={`row ${state.is_collpase[1] ? 'collapse': ''}`}>
                      <div className="directive">
                        <strong>Do you intend to draw organic traffic from this asset?</strong>
                        <button className="toggle" onClick={(e) => this.collapse(e, 1)}><i className="icon-arrow-up-circle"></i></button>
                      </div>
                      <div className="content">
                          <span className={`chk ${state.doc.data && state.doc.data['2_1_1'] ? 'checked': ''}`} onClick={(e) => this.handle_doc_change(e, '2_1_1', 'radio->2_1_2')}>Yes</span>
                          <span className={`chk ${state.doc.data && state.doc.data['2_1_2'] ? 'checked': ''}`} onClick={(e) => this.handle_doc_change(e, '2_1_2', 'radio->2_1_1')}>No</span>
                      </div>
                    </div>
                    <div className={`row ${state.is_collpase[2] ? 'collapse': ''}`}>
                      <div className="directive">
                        <strong>Stage of development:</strong>
                        <button className="toggle" onClick={(e) => this.collapse(e, 2)}><i className="icon-arrow-up-circle"></i></button>
                      </div>
                      <div className="content">
                          <span className={`chk ${state.doc.data && state.doc.data['2_2_1'] ? 'checked': ''}`} onClick={(e) => this.handle_doc_change(e, '2_2_1', 'chk')}>New</span>
                          <span className={`chk ${state.doc.data && state.doc.data['2_2_2'] ? 'checked': ''}`} onClick={(e) => this.handle_doc_change(e, '2_2_2', 'chk')}>Optimization*</span>
                          <span className={`chk ${state.doc.data && state.doc.data['2_2_3'] ? 'checked': ''}`} onClick={(e) => this.handle_doc_change(e, '2_2_3', 'chk')}>(Hardcopy) Update or Refresh</span>
                          <div className="new-line">
                            *Provide URL <span className="small green">(if Optimization):</span>
                            <input type="url" onChange={(e) => this.handle_doc_change(e, '2_2_4', 'text')} readOnly={state.user.role === 'author-brief'} value={state.doc.data ?  state.doc.data['2_2_4'] : ''} />
                          </div>
                          <br/>
                          <div className="new-line">
                            *This content has been translated to  
                          </div>
                          <span className={`chk ${state.doc.data && state.doc.data['2_2_5'] ? 'checked': ''}`} onClick={(e) => this.handle_doc_change(e, '2_2_5', 'chk')}>German</span>
                          <span className={`chk ${state.doc.data && state.doc.data['2_2_6'] ? 'checked': ''}`} onClick={(e) => this.handle_doc_change(e, '2_2_6', 'chk')}>French</span>
                          <span className={`chk ${state.doc.data && state.doc.data['2_2_7'] ? 'checked': ''}`} onClick={(e) => this.handle_doc_change(e, '2_2_7', 'chk')}>Norweigan</span>
                          <span className={`chk ${state.doc.data && state.doc.data['2_2_8'] ? 'checked': ''}`} onClick={(e) => this.handle_doc_change(e, '2_2_8', 'chk')}>Sweden</span>
                          <div className="new-line">If content has been translated into languages other than English, Lori Baldwin must confirm that translation budget is available for the optimization. Has Lori approved?</div>
                          <span className={`chk ${state.doc.data && state.doc.data['2_2_9'] ? 'checked': ''}`} onClick={(e) => this.handle_doc_change(e, '2_2_9', 'radio->2_2_10')}>Yes</span>
                          <span className={`chk ${state.doc.data && state.doc.data['2_2_10'] ? 'checked': ''}`} onClick={(e) => this.handle_doc_change(e, '2_2_10', 'radio->2_2_9')}>No</span>
                      </div>
                    </div>
                    <div className={`row ${state.is_collpase[3] ? 'collapse': ''}`}>
                      <div className="directive">
                        <strong>Working name or title of the asset:</strong><br/>
                        <span className="small green">List the proposed asset title or the theme or topics to brainstorm the title.</span>
                        <button className="toggle" onClick={(e) => this.collapse(e, 3)}><i className="icon-arrow-up-circle"></i></button>
                      </div>
                      <div className="content has-paddingtop">
                      { state.user.role !== 'author-brief' &&
                        <button className="edit" onClick={(e) => this.open_editor('2_3_1')}>
                          <i className="icon-pencil-alt-solid"></i>
                        </button>
                      }
                      <div className="ql-editor" dangerouslySetInnerHTML={{ __html: state.doc.data['2_3_1'] }} />
                      
                      </div>
                    </div>
                    <div className={`row ${state.is_collpase[4] ? 'collapse': ''}`}>
                      <div className="directive">
                        <strong>Description and purpose of content:</strong><br/>
                        <ul>
                          <li className="small green">What is the expected outcome for the reader/viewer after reading this content?</li>
                          <li className="small green">What information will this content provide?</li>
                          <li className="small green">Why is this content necessary?</li>
                        </ul>
                        <span className="small green"></span>
                        <button className="toggle" onClick={(e) => this.collapse(e, 4)}><i className="icon-arrow-up-circle"></i></button>
                      </div>
                      <div className="content has-paddingtop">
                          <p>The purpose is to create content that leverages current top-ranking content to draw organic traffic to the planview.com site, interest users in the content, and engage users to convert to the page offer and/or consume additional site content.</p>
                      </div>
                    </div>
                    <div className={`row ${state.is_collpase[5] ? 'collapse': ''}`}>
                      <div className="directive">
                        <strong>Characters in title:</strong><br/>
                        <span className="small green">(Maximum 54. Use lettercount.com)</span>
                        <button className="toggle" onClick={(e) => this.collapse(e, 5)}><i className="icon-arrow-up-circle"></i></button>
                      </div>
                      <div className="content has-paddingtop">
                          <input type="text" onChange={(e) => this.handle_doc_change(e, '2_5_1', 'text')} readOnly={state.user.role === 'author-brief'} value={state.doc.data ?  state.doc.data['2_5_1'] : ''} />
                      </div>
                    </div>
                    <div className={`row ${state.is_collpase[6] ? 'collapse': ''}`}>
                      <div className="directive">
                        <strong>Characters in title + “| Planview”:</strong><br/>
                        <span className="small green">(Maximum 65. Use lettercount.com)</span>
                        <button className="toggle" onClick={(e) => this.collapse(e, 6)}><i className="icon-arrow-up-circle"></i></button>
                      </div>
                      <div className="content has-paddingtop">
                          <input type="text" maxLength={65} onChange={(e) => this.handle_doc_change(e, '2_6_1', 'text')} readOnly={state.user.role === 'author-brief'} value={state.doc.data ?  state.doc.data['2_6_1'] : ''} />
                      </div>
                    </div>
                    <div className={`row ${state.is_collpase[7] ? 'collapse': ''}`}>
                      <div className="directive">
                        <strong>Primary keyword and data:</strong><br/>
                        <span className="small green">(ranking and analytics)</span>
                        <button className="toggle" onClick={(e) => this.collapse(e, 7)}><i className="icon-arrow-up-circle"></i></button>
                      </div>
                      <div className="content has-paddingtop">
                          <input type="text" onChange={(e) => this.handle_doc_change(e, '2_7_1', 'text')} readOnly={state.user.role === 'author-brief'} value={state.doc.data ?  state.doc.data['2_7_1'] : ''} />
                      </div>
                    </div>
                    <div className={`row ${state.is_collpase[8] ? 'collapse': ''}`}>
                      <div className="directive">
                        <strong>Word Count:</strong><br/>
                        <button className="toggle" onClick={(e) => this.collapse(e, 8)}><i className="icon-arrow-up-circle"></i></button>
                      </div>
                      <div className="content">
                          <p className="new-line">Current Word Count: 
                          <input type="number" onChange={(e) => this.handle_doc_change(e, '2_8_1', 'text')} readOnly={state.user.role === 'author-brief'} value={state.doc.data ?  state.doc.data['2_8_1'] : ''} /></p>
                          <p className="new-line bg-blue">Target Word Count: 
                          <input type="number" onChange={(e) => this.handle_doc_change(e, '2_8_2', 'text')} readOnly={state.user.role === 'author-brief'} value={state.doc.data ?  state.doc.data['2_8_2'] : ''} /></p>
                      </div>
                    </div>
                    <div className={`row ${state.is_collpase[9] ? 'collapse': ''}`}>
                      <div className="directive">
                        <strong>Buyer’s journey phase</strong><br/>
                        <button className="toggle" onClick={(e) => this.collapse(e, 9)}><i className="icon-arrow-up-circle"></i></button>
                      </div>
                      <div className="content">
                        <span className={`chk ${state.doc.data && state.doc.data['2_9_1'] ? 'checked': ''}`} onClick={(e) => this.handle_doc_change(e, '2_9_1', 'chk')}>Search</span>
                        <span className={`chk ${state.doc.data && state.doc.data['2_9_2'] ? 'checked': ''}`} onClick={(e) => this.handle_doc_change(e, '2_9_2', 'chk')}>Awareness</span>
                        <span className={`chk ${state.doc.data && state.doc.data['2_9_3'] ? 'checked': ''}`} onClick={(e) => this.handle_doc_change(e, '2_9_3', 'chk')}>Consideration</span>
                        <span className={`chk ${state.doc.data && state.doc.data['2_9_4'] ? 'checked': ''}`} onClick={(e) => this.handle_doc_change(e, '2_9_4', 'chk')}>Selection/Decision</span>
                      </div>
                    </div>
                                        
                    <div className={`row ${state.is_collpase[12] ? 'collapse': ''}`}>
                      <div className="directive">
                        <strong>Other required optimizations:</strong><br/>
                        <span className="small green">(include keyword; limited to 150 characters. Use lettercount.com)</span>
                        <button className="toggle" onClick={(e) => this.collapse(e, 12)}><i className="icon-arrow-up-circle"></i></button>
                      </div>
                      <div className="content">
                        <span className={`chk ${state.doc.data && state.doc.data['2_12_1'] ? 'checked': ''}`} onClick={(e) => this.handle_doc_change(e, '2_12_1', 'chk')}>Images</span>
                        <span className={`chk ${state.doc.data && state.doc.data['2_12_2'] ? 'checked': ''}`} onClick={(e) => this.handle_doc_change(e, '2_12_2', 'chk')}>Screenshot</span>
                        <span className={`chk ${state.doc.data && state.doc.data['2_12_3'] ? 'checked': ''}`} onClick={(e) => this.handle_doc_change(e, '2_12_3', 'chk')}>Captions</span>
                        <div className="new-line">
                          Captions for all images must include the keyword 
                          <input type="text" onChange={(e) => this.handle_doc_change(e, '2_12_4', 'text')} readOnly={state.user.role === 'author-brief'} value={state.doc.data ?  state.doc.data['2_12_4'] : ''} />
                        </div>
                        <div className="new-line">
                          Captions for screenshots can explain solution benefits but must not mention the brand
                        </div>
                      </div>
                    </div>
                    <div className={`row ${state.is_collpase[13] ? 'collapse': ''}`}>
                      <div className="directive">
                        <strong>Top-Ranked Pages to Review</strong><br/>
                        <button className="toggle" onClick={(e) => this.collapse(e, 13)}><i className="icon-arrow-up-circle"></i></button>
                      </div>
                      <div className="content has-paddingtop">
                        { state.user.role !== 'author-brief' &&
                          <button className="edit" onClick={(e) => this.open_editor('2_13_1')}>
                            <i className="icon-pencil-alt-solid"></i>
                          </button>
                        }
                        <div className="ql-editor" dangerouslySetInnerHTML={{ __html: state.doc.data['2_13_1'] }} />`
                      </div>
                      
                    </div>
                    <div className={`row ${state.is_collpase[14] ? 'collapse': ''}`}>
                      <div className="directive">
                        <strong>Instructions for How to Optimize</strong><br/>
                        <button className="toggle" onClick={(e) => this.collapse(e, 14)}><i className="icon-arrow-up-circle"></i></button>
                      </div>
                      <div className="content has-paddingtop">
                        {
                          state.user.role !== 'author-brief' &&
                          <button className="edit" onClick={(e) => this.open_editor('2_14_1')}>
                            <i className="icon-pencil-alt-solid"></i>
                          </button>
                        }
                        <div className="ql-editor" dangerouslySetInnerHTML={{ __html: state.doc.data['2_14_1'] ?  state.doc.data['2_14_1'] : state.instruction }} />
                      </div>
                    </div>
                    <div className={`row ${state.is_collpase[15] ? 'collapse': ''}`}>
                      <div className="directive">
                        <strong>Content Instructions or Message Outline for the Writer</strong><br/>
                        <span className="small green">(remember to integrate SEO instructions (if Asset is SEO related) and review each Top-Ranked Page listed above)</span>
                        <button className="toggle" onClick={(e) => this.collapse(e, 15)}><i className="icon-arrow-up-circle"></i></button>
                      </div>
                      <div className="content has-paddingtop">
                      { state.user.role !== 'author-brief' &&
                        <button className="edit" onClick={(e) => this.open_editor('2_15_1')}>
                          <i className="icon-pencil-alt-solid"></i>
                        </button>
                      }
                      <div className="ql-editor" dangerouslySetInnerHTML={{ __html: state.doc.data['2_15_1'] }} />
                      </div>
                    </div>
                  </li>
                  <li className={`step-dark-blue ${state.step_close[2] ? 'close': ''}`}>
                    <legend onClick={(e) => this.close_step(e, 2)}>Step 3: Content or Messaging Details</legend>
                    <div className={`row ${state.is_collpase[16] ? 'collapse': ''}`}>
                      <div className="directive">
                        <strong>Tone</strong><br/>
                        <button className="toggle" onClick={(e) => this.collapse(e, 16)}><i className="icon-arrow-up-circle"></i></button>
                      </div>
                      <div className="content has-paddingtop">
                      { state.user.role !== 'author-brief' &&
                        <button className="edit" onClick={(e) => this.open_editor('3_1_1')}>
                          <i className="icon-pencil-alt-solid"></i>
                        </button>
                      }
                      <div className="ql-editor" dangerouslySetInnerHTML={{ __html: state.doc.data['3_1_1'] }} />
                      
                      </div>
                    </div>
                    <div className={`row ${state.is_collpase[17] ? 'collapse': ''}`}>
                      <div className="directive">
                        <strong>Voice of Planview Document</strong><br/>
                        <button className="toggle" onClick={(e) => this.collapse(e, 17)}><i className="icon-arrow-up-circle"></i></button>
                      </div>
                      <div className="content has-paddingtop">
                      { state.user.role !== 'author-brief' &&
                        <button className="edit" onClick={(e) => this.open_editor('3_2_1')}>
                          <i className="icon-pencil-alt-solid"></i>
                        </button>
                      }
                      <div className="ql-editor" dangerouslySetInnerHTML={{ __html: state.doc.data['3_2_1'] }} />
                      
                      </div>
                    </div>
                    <div className={`row ${state.is_collpase[18] ? 'collapse': ''}`}>
                      <div className="directive">
                        <strong>Angle</strong><br/>
                        <button className="toggle" onClick={(e) => this.collapse(e, 18)}><i className="icon-arrow-up-circle"></i></button>
                      </div>
                      <div className="content has-paddingtop">
                      { state.user.role !== 'author-brief' &&
                        <button className="edit" onClick={(e) => this.open_editor('3_3_1')}>
                          <i className="icon-pencil-alt-solid"></i>
                        </button>
                      }
                      <div className="ql-editor" dangerouslySetInnerHTML={{ __html: state.doc.data['3_3_1'] }} />
                      
                      </div>
                    </div>
                    <div className={`row ${state.is_collpase[19] ? 'collapse': ''}`}>
                      <div className="directive">
                        <strong>Source or Supporting Materials</strong><br/>
                        <span className="small green">List related assets or content (Planview or 3rd Party) that the writers can use create the new asset. Include, asset name, type, and hyperlinks in the list or attach materials to Projectplace or LeanKit card associated with the project.</span>
                        <button className="toggle" onClick={(e) => this.collapse(e, 19)}><i className="icon-arrow-up-circle"></i></button>
                      </div>
                      <div className="content has-paddingtop">
                      { state.user.role !== 'author-brief' &&
                        <button className="edit" onClick={(e) => this.open_editor('3_4_1')}>
                          <i className="icon-pencil-alt-solid"></i>
                        </button>
                      }
                      <div className="ql-editor" dangerouslySetInnerHTML={{ __html: state.doc.data['3_4_1'] }} />
                      
                      </div>
                    </div>
                    <div className={`row ${state.is_collpase[20] ? 'collapse': ''}`}>
                      <div className="directive">
                        <strong>Planvew Solutions</strong><br/>                      
                        <button className="toggle" onClick={(e) => this.collapse(e, 20)}><i className="icon-arrow-up-circle"></i></button>
                      </div>
                      <div className="content has-paddingtop">
                          <span className={`chk ${state.doc.data && state.doc.data['3_5_1'] ? 'checked': ''}`} onClick={(e) => this.handle_doc_change(e, '3_5_1', 'chk')}>Project Portfolio Management</span>
                          <span className={`chk ${state.doc.data && state.doc.data['3_5_2'] ? 'checked': ''}`} onClick={(e) => this.handle_doc_change(e, '3_5_2', 'chk')}>Enterprise Agile Planning</span>
                          <span className={`chk ${state.doc.data && state.doc.data['3_5_3'] ? 'checked': ''}`} onClick={(e) => this.handle_doc_change(e, '3_5_3', 'chk')}>Strategic Portfolio Management</span>
                          <span className={`chk ${state.doc.data && state.doc.data['3_5_4'] ? 'checked': ''}`} onClick={(e) => this.handle_doc_change(e, '3_5_4', 'chk')}>Lean Portfolio Management</span>
                          <span className={`chk ${state.doc.data && state.doc.data['3_5_5'] ? 'checked': ''}`} onClick={(e) => this.handle_doc_change(e, '3_5_5', 'chk')}>Enterprise Architecture</span>
                          <span className={`chk ${state.doc.data && state.doc.data['3_5_6'] ? 'checked': ''}`} onClick={(e) => this.handle_doc_change(e, '3_5_6', 'chk')}>Agile Program Management</span>
                          <span className={`chk ${state.doc.data && state.doc.data['3_5_7'] ? 'checked': ''}`} onClick={(e) => this.handle_doc_change(e, '3_5_7', 'chk')}>Product Portfolio Management</span>
                          <span className={`chk ${state.doc.data && state.doc.data['3_5_8'] ? 'checked': ''}`} onClick={(e) => this.handle_doc_change(e, '3_5_8', 'chk')}>Enterprise Kanban for Agile Delivery</span>
                          <span className={`chk ${state.doc.data && state.doc.data['3_5_9'] ? 'checked': ''}`} onClick={(e) => this.handle_doc_change(e, '3_5_9', 'chk')}>Innovation Management</span>
                          <span className={`chk ${state.doc.data && state.doc.data['3_5_10'] ? 'checked': ''}`} onClick={(e) => this.handle_doc_change(e, '3_5_10', 'chk')}>Work Management for Teams</span>
                          <span className={`chk ${state.doc.data && state.doc.data['3_5_11'] ? 'checked': ''}`} onClick={(e) => this.handle_doc_change(e, '3_5_11', 'chk')}>Professional Services Automation</span>
                      </div>
                    </div>
                    <div className={`row ${state.is_collpase[21] ? 'collapse': ''}`}>
                      <div className="directive">
                        <strong>Planvew Products</strong><br/>                      
                        <button className="toggle" onClick={(e) => this.collapse(e, 21)}><i className="icon-arrow-up-circle"></i></button>
                      </div>
                      <div className="content has-paddingtop">
                          <span className={`chk ${state.doc.data && state.doc.data['3_6_1'] ? 'checked': ''}`} onClick={(e) => this.handle_doc_change(e, '3_6_1', 'chk')}>Planview Enterprise One </span>
                          <span className={`chk ${state.doc.data && state.doc.data['3_6_2'] ? 'checked': ''}`} onClick={(e) => this.handle_doc_change(e, '3_6_2', 'chk')}>Planview PPM Pro  </span>
                          <span className={`chk ${state.doc.data && state.doc.data['3_6_3'] ? 'checked': ''}`} onClick={(e) => this.handle_doc_change(e, '3_6_3', 'chk')}>Planview LeanKit</span>
                          <span className={`chk ${state.doc.data && state.doc.data['3_6_4'] ? 'checked': ''}`} onClick={(e) => this.handle_doc_change(e, '3_6_4', 'chk')}>Planview Projectplace</span>
                          <span className={`chk ${state.doc.data && state.doc.data['3_6_5'] ? 'checked': ''}`} onClick={(e) => this.handle_doc_change(e, '3_6_5', 'chk')}>Planview Spigit</span>
                          <span className={`chk ${state.doc.data && state.doc.data['3_6_6'] ? 'checked': ''}`} onClick={(e) => this.handle_doc_change(e, '3_6_6', 'chk')}>FLEX</span>
                          <span className={`chk ${state.doc.data && state.doc.data['3_6_7'] ? 'checked': ''}`} onClick={(e) => this.handle_doc_change(e, '3_6_7', 'chk')}>Planview Clarizen</span>
                          <span className={`chk ${state.doc.data && state.doc.data['3_6_8'] ? 'checked': ''}`} onClick={(e) => this.handle_doc_change(e, '3_6_8', 'chk')}>Planview Changepoint</span>
                          <span className={`chk ${state.doc.data && state.doc.data['3_6_9'] ? 'checked': ''}`} onClick={(e) => this.handle_doc_change(e, '3_6_9', 'chk')}>Planview Daptiv</span>
                          <span className={`chk ${state.doc.data && state.doc.data['3_6_10'] ? 'checked': ''}`} onClick={(e) => this.handle_doc_change(e, '3_6_10', 'chk')}>Planview Barometer</span>
                      </div>
                    </div>
                  </li>
                  <li className={`step-purple ${state.step_close[3] ? 'close': ''}`}>
                    <legend onClick={(e) => this.close_step(e, 3)}>Step 4: Content Creation Process Details</legend>
                    <div className={`row ${state.is_collpase[22] ? 'collapse': ''}`}>
                      <div className="directive">
                        <strong>Subject Matter Experts (SMEs)</strong>
                        <button className="toggle" onClick={(e) => this.collapse(e, 22)}><i className="icon-arrow-up-circle"></i></button>
                      </div>
                      <div className="content has-paddingtop">
                      { state.user.role !== 'author-brief' &&
                        <button className="edit" onClick={(e) => this.open_editor('4_1_1')}>
                          <i className="icon-pencil-alt-solid"></i>
                        </button>
                      }
                      <div className="ql-editor" dangerouslySetInnerHTML={{ __html: state.doc.data['4_1_1'] }} />
                      
                      </div>
                    </div>
                    <div className={`row ${state.is_collpase[23] ? 'collapse': ''}`}>
                      <div className="directive">
                        <strong>Go-To-Market Team</strong>
                        <button className="toggle" onClick={(e) => this.collapse(e, 23)}><i className="icon-arrow-up-circle"></i></button>
                      </div>
                      <div className="content">
                        <span className={`chk ${state.doc.data && state.doc.data['4_2_1'] ? 'checked': ''}`} onClick={(e) => this.handle_doc_change(e, '4_2_1', 'chk')}>PRiMetime</span>
                        <span className={`chk ${state.doc.data && state.doc.data['4_2_2'] ? 'checked': ''}`} onClick={(e) => this.handle_doc_change(e, '4_2_2', 'chk')}>LADitude</span>
                        <span className={`chk ${state.doc.data && state.doc.data['4_2_3'] ? 'checked': ''}`} onClick={(e) => this.handle_doc_change(e, '4_2_3', 'chk')}>T3</span>
                        <span className={`chk ${state.doc.data && state.doc.data['4_2_4'] ? 'checked': ''}`} onClick={(e) => this.handle_doc_change(e, '4_2_4', 'chk')}>Corporate Marketing</span>
                        <span className={`chk ${state.doc.data && state.doc.data['4_2_5'] ? 'checked': ''}`} onClick={(e) => this.handle_doc_change(e, '4_2_5', 'chk')}>EMEA</span>
                        <span className={`chk ${state.doc.data && state.doc.data['4_2_7'] ? 'checked': ''}`} onClick={(e) => this.handle_doc_change(e, '4_2_7', 'chk')}>PSA</span>
                        <span className={`chk has-input ${state.doc.data && state.doc.data['4_2_6'] ? 'checked': ''}`}>Other 
                        <input type="text" onChange={(e) => this.handle_doc_change(e, '4_2_6', 'other')} readOnly={state.user.role === 'author-brief'} value={state.doc.data ?  state.doc.data['4_2_6'] : ''} /></span>
                      </div>
                    </div>
                    <div className={`row ${state.is_collpase[24] ? 'collapse': ''}`}>
                      <div className="directive">
                        <strong>Content Strategist</strong>
                        <button className="toggle" onClick={(e) => this.collapse(e, 24)}><i className="icon-arrow-up-circle"></i></button>
                      </div>
                      <div className="content has-paddingtop">
                        <input type="text" onChange={(e) => this.handle_doc_change(e, '4_3_1', 'text')} readOnly={state.user.role === 'author-brief'} value={state.doc.data ?  state.doc.data['4_3_1'] : ''} />
                      </div>
                    </div>
                    <div className={`row ${state.is_collpase[25] ? 'collapse': ''}`}>
                      <div className="directive">
                        <strong>(Contract) Writer</strong>
                        <button className="toggle" onClick={(e) => this.collapse(e, 25)}><i className="icon-arrow-up-circle"></i></button>
                      </div>
                      <div className="content has-paddingtop">
                        <input type="text" onChange={(e) => this.handle_doc_change(e, '4_4_1', 'text')} readOnly={state.user.role === 'author-brief'} value={state.doc.data ?  state.doc.data['4_4_1'] : ''} />
                      </div>
                    </div>
                    <div className={`row ${state.is_collpase[26] ? 'collapse': ''}`}>
                      <div className="directive">
                        <strong>Kick-Off Date</strong>
                        <button className="toggle" onClick={(e) => this.collapse(e, 26)}><i className="icon-arrow-up-circle"></i></button>
                      </div>
                      <div className="content has-paddingtop">
                        <input type="date" onChange={(e) => this.handle_doc_change(e, '4_5_1', 'date')} readOnly={state.user.role === 'author-brief'} value={state.doc.data ?  state.doc.data['4_5_1'] : ''} />
                      </div>
                    </div>
                    <div className={`row ${state.is_collpase[44] ? 'collapse': ''}`}>
                      <div className="directive">
                        <strong>First Draft Due</strong>
                        <button className="toggle" onClick={(e) => this.collapse(e, 44)}><i className="icon-arrow-up-circle"></i></button>
                      </div>
                      <div className="content has-paddingtop">
                        <input type="date" onChange={(e) => this.handle_doc_change(e, '4_7_1', 'date')} readOnly={state.user.role === 'author-brief'} value={state.doc.data ?  state.doc.data['4_7_1'] : ''} />
                      </div>
                    </div>
                    <div className={`row ${state.is_collpase[45] ? 'collapse': ''}`}>
                      <div className="directive">
                        <strong>Final Copy Due</strong>
                        <button className="toggle" onClick={(e) => this.collapse(e, 45)}><i className="icon-arrow-up-circle"></i></button>
                      </div>
                      <div className="content has-paddingtop">
                        <input type="date" onChange={(e) => this.handle_doc_change(e, '4_8_1', 'date')} readOnly={state.user.role === 'author-brief'} value={state.doc.data ?  state.doc.data['4_8_1'] : ''} />
                      </div>
                    </div>                    
                    <div className={`row ${state.is_collpase[46] ? 'collapse': ''}`}>
                      <div className="directive">
                        <strong>SEO Deadline</strong>
                        <button className="toggle" onClick={(e) => this.collapse(e, 46)}><i className="icon-arrow-up-circle"></i></button>
                      </div>
                      <div className="content has-paddingtop">
                        <input type="date" onChange={(e) => this.handle_doc_change(e, '4_9_1', 'date')} readOnly={state.user.role === 'author-brief'} value={state.doc.data ?  state.doc.data['4_9_1'] : ''} />
                      </div>
                    </div>                    
                  </li>
                  <li className={`step-red ${state.step_close[4] ? 'close': ''}`}>
                    <legend onClick={(e) => this.close_step(e, 4)}>Step 5: Marketing Details</legend>
                    <div className={`row ${state.is_collpase[28] ? 'collapse': ''}`}>
                      <div className="directive">
                        <strong>Description and purpose of content:</strong><br/>
                        <span className="small green">
                          <ul>
                            <li>What is the expected outcome for the reader/viewer after reading this content?</li>
                            <li>What information will this content provide?</li>
                            <li>Why is this content necessary? Does something already exist?</li>
                          </ul>
                        </span>
                        <button className="toggle" onClick={(e) => this.collapse(e, 28)}><i className="icon-arrow-up-circle"></i></button>
                      </div>
                      <div className="content has-paddingtop">
                      { state.user.role !== 'author-brief' &&
                        <button className="edit" onClick={(e) => this.open_editor('5_1_1')}>
                          <i className="icon-pencil-alt-solid"></i>
                        </button>
                      }
                      <div className="ql-editor" dangerouslySetInnerHTML={{ __html: state.doc.data['5_1_1'] }} />
                      
                      </div>
                    </div>
                    <div className={`row ${state.is_collpase[29] ? 'collapse': ''}`}>
                      <div className="directive">
                        <strong>Demand Generation</strong><br/>
                        <span className="small green">(Campaign or Nurture Name)</span>
                        <button className="toggle" onClick={(e) => this.collapse(e, 29)}><i className="icon-arrow-up-circle"></i></button>
                      </div>
                      <div className="content has-paddingtop">
                        <input type="text" onChange={(e) => this.handle_doc_change(e, '5_2_1', 'text')} readOnly={state.user.role === 'author-brief'} value={state.doc.data ?  state.doc.data['5_2_1'] : ''} />
                      </div>
                    </div>
                    <div className={`row ${state.is_collpase[30] ? 'collapse': ''}`}>
                      <div className="directive">
                        <strong>Gated or Ungated?</strong>
                        <button className="toggle" onClick={(e) => this.collapse(e, 30)}><i className="icon-arrow-up-circle"></i></button>
                      </div>
                      <div className="content has-paddingtop">
                        <span className={`chk ${state.doc.data && state.doc.data['5_3_1'] ? 'checked': ''}`} onClick={(e) => this.handle_doc_change(e, '5_3_1', 'radio->5_3_2')}>Gated</span>
                        <span className={`chk ${state.doc.data && state.doc.data['5_3_2'] ? 'checked': ''}`} onClick={(e) => this.handle_doc_change(e, '5_3_2', 'radio->5_3_1')}>Ungated</span>
                      </div>
                    </div>
                    <div className={`row ${state.is_collpase[31] ? 'collapse': ''}`}>
                      <div className="directive">
                        <strong>Associated Planview Blog keyword and data:</strong><br/>
                        <span className="small green">(For Registration Page associated with asset ranking and analytics)</span>
                        <button className="toggle" onClick={(e) => this.collapse(e, 31)}><i className="icon-arrow-up-circle"></i></button>
                      </div>
                      <div className="content has-paddingtop">
                      { state.user.role !== 'author-brief' &&
                        <button className="edit" onClick={(e) => this.open_editor('5_4_1')}>
                          <i className="icon-pencil-alt-solid"></i>
                        </button>
                      }
                      <div className="ql-editor" dangerouslySetInnerHTML={{ __html: state.doc.data['5_4_1'] }} />
                      
                      </div>
                    </div>
                    <div className={`row ${state.is_collpase[32] ? 'collapse': ''}`}>
                      <div className="directive">
                        <strong>Target Audience</strong><br/>
                        <span className="small green">(Targeted Roles or Titles)</span>
                        <button className="toggle" onClick={(e) => this.collapse(e, 32)}><i className="icon-arrow-up-circle"></i></button>
                      </div>
                      <div className="content has-paddingtop">
                        <input type="text" onChange={(e) => this.handle_doc_change(e, '5_5_1', 'text')} readOnly={state.user.role === 'author-brief'} value={state.doc.data ?  state.doc.data['5_5_1'] : ''} />
                      </div>
                    </div>
                    <div className={`row ${state.is_collpase[33] ? 'collapse': ''}`}>
                      <div className="directive">
                        <strong>Organization Level</strong>
                        <button className="toggle" onClick={(e) => this.collapse(e, 33)}><i className="icon-arrow-up-circle"></i></button>
                      </div>
                      <div className="content has-paddingtop">
                        <input type="text" onChange={(e) => this.handle_doc_change(e, '5_6_1', 'text')} readOnly={state.user.role === 'author-brief'} value={state.doc.data ?  state.doc.data['5_6_1'] : ''} />
                      </div>
                    </div>
                    <div className={`row ${state.is_collpase[34] ? 'collapse': ''}`}>
                      <div className="directive">
                        <strong>Industry</strong><br/>
                        <span className="small green">(example: Manufacturing) </span>
                        <button className="toggle" onClick={(e) => this.collapse(e, 34)}><i className="icon-arrow-up-circle"></i></button>
                      </div>
                      <div className="content has-paddingtop">
                        <input type="text" onChange={(e) => this.handle_doc_change(e, '5_7_1', 'text')} readOnly={state.user.role === 'author-brief'} value={state.doc.data ?  state.doc.data['5_7_1'] : ''} />
                      </div>
                    </div>
                    <div className={`row ${state.is_collpase[35] ? 'collapse': ''}`}>
                      <div className="directive">
                        <strong>Sub-Industry </strong><br/>
                        <span className="small green">(example: Automobile)</span>
                        <button className="toggle" onClick={(e) => this.collapse(e, 35)}><i className="icon-arrow-up-circle"></i></button>
                      </div>
                      <div className="content has-paddingtop">
                        <input type="text" onChange={(e) => this.handle_doc_change(e, '5_8_1', 'text')} readOnly={state.user.role === 'author-brief'} value={state.doc.data ?  state.doc.data['5_8_1'] : ''} />
                      </div>
                    </div>
                    <div className={`row ${state.is_collpase[36] ? 'collapse': ''}`}>
                      <div className="directive">
                        <strong>Team </strong><br/>
                        <span className="small green">(example: Software, Product Dev.)</span>
                        <button className="toggle" onClick={(e) => this.collapse(e, 36)}><i className="icon-arrow-up-circle"></i></button>
                      </div>
                      <div className="content has-paddingtop">
                        <input type="text" onChange={(e) => this.handle_doc_change(e, '5_9_1', 'text')} readOnly={state.user.role === 'author-brief'} value={state.doc.data ?  state.doc.data['5_9_1'] : ''} />
                      </div>
                    </div>
                    <div className={`row ${state.is_collpase[37] ? 'collapse': ''}`}>
                      <div className="directive">
                        <strong>Region </strong>
                        <button className="toggle" onClick={(e) => this.collapse(e, 37)}><i className="icon-arrow-up-circle"></i></button>
                      </div>
                      <div className="content has-paddingtop">
                        <span className={`chk ${state.doc.data && state.doc.data['5_10_1'] ? 'checked': ''}`} onClick={(e) => this.handle_doc_change(e, '5_10_1', 'chk')}>NA</span>
                        <span className={`chk ${state.doc.data && state.doc.data['5_10_2'] ? 'checked': ''}`} onClick={(e) => this.handle_doc_change(e, '5_10_2', 'chk')}>EMEA</span>
                        <span className={`chk ${state.doc.data && state.doc.data['5_10_3'] ? 'checked': ''}`} onClick={(e) => this.handle_doc_change(e, '5_10_3', 'chk')}>APAC</span>
                        <span className={`chk ${state.doc.data && state.doc.data['5_10_4'] ? 'checked': ''}`} onClick={(e) => this.handle_doc_change(e, '5_10_4', 'chk')}>WW</span>
                        <span className={`chk has-input ${state.doc.data && state.doc.data['5_10_5'] ? 'checked': ''}`}>Other 
                        <input type="text" onChange={(e) => this.handle_doc_change(e, '5_10_5', 'other')} readOnly={state.user.role === 'author-brief'} value={state.doc.data ?  state.doc.data['5_10_5'] : ''} /></span>
                      </div>
                    </div>
                    <div className={`row ${state.is_collpase[38] ? 'collapse': ''}`}>
                      <div className="directive">
                        <strong>Translation Required? </strong>
                        <button className="toggle" onClick={(e) => this.collapse(e, 38)}><i className="icon-arrow-up-circle"></i></button>
                      </div>
                      <div className="content has-paddingtop">
                        <span className={`chk ${state.doc.data && state.doc.data['5_11_1'] ? 'checked': ''}`} onClick={(e) => this.handle_doc_change(e, '5_11_1', 'chk')}>French</span>
                        <span className={`chk ${state.doc.data && state.doc.data['5_11_2'] ? 'checked': ''}`} onClick={(e) => this.handle_doc_change(e, '5_11_2', 'chk')}>German</span>
                        <span className={`chk ${state.doc.data && state.doc.data['5_11_3'] ? 'checked': ''}`} onClick={(e) => this.handle_doc_change(e, '5_11_3', 'chk')}>Norweigan</span>
                        <span className={`chk ${state.doc.data && state.doc.data['5_11_4'] ? 'checked': ''}`} onClick={(e) => this.handle_doc_change(e, '5_11_4', 'chk')}>Swedish</span>
                        <span className={`chk has-input ${state.doc.data && state.doc.data['5_11_5'] ? 'checked': ''}`}>Other 
                        <input type="text" onChange={(e) => this.handle_doc_change(e, '5_11_5', 'other')} readOnly={state.user.role === 'author-brief'} value={state.doc.data ?  state.doc.data['5_11_5'] : ''} /></span>
                      </div>
                    </div>
                    <div className={`row ${state.is_collpase[39] ? 'collapse': ''}`}>
                      <div className="directive">
                        <strong>Currently Translated </strong>
                        <button className="toggle" onClick={(e) => this.collapse(e, 39)}><i className="icon-arrow-up-circle"></i></button>
                      </div>
                      <div className="content has-paddingtop">
                        <span className={`chk ${state.doc.data && state.doc.data['5_12_1'] ? 'checked': ''}`} onClick={(e) => this.handle_doc_change(e, '5_12_1', 'chk')}>French</span>
                        <span className={`chk ${state.doc.data && state.doc.data['5_12_2'] ? 'checked': ''}`} onClick={(e) => this.handle_doc_change(e, '5_12_2', 'chk')}>German</span>
                        <span className={`chk ${state.doc.data && state.doc.data['5_12_3'] ? 'checked': ''}`} onClick={(e) => this.handle_doc_change(e, '5_12_3', 'chk')}>Norweigan</span>
                        <span className={`chk ${state.doc.data && state.doc.data['5_12_4'] ? 'checked': ''}`} onClick={(e) => this.handle_doc_change(e, '5_12_4', 'chk')}>Swedish</span>
                        <span className={`chk has-input ${state.doc.data && state.doc.data['5_12_5'] ? 'checked': ''}`}>Other 
                        <input type="text" onChange={(e) => this.handle_doc_change(e, '5_12_5', 'other')} readOnly={state.user.role === 'author-brief'} value={state.doc.data ?  state.doc.data['5_12_5'] : ''} /></span>
                      </div>
                    </div>
                  </li>
                  <li className={`step-yellow ${state.step_close[5] ? 'close': ''}`}>
                    <legend onClick={(e) => this.close_step(e, 5)}>Step 6: Design Creation Details</legend>
                    <div className={`row ${state.is_collpase[40] ? 'collapse': ''}`}>
                      <div className="directive">
                        <strong>Graphical Theme</strong>
                        <button className="toggle" onClick={(e) => this.collapse(e, 40)}><i className="icon-arrow-up-circle"></i></button>
                      </div>
                      <div className="content has-paddingtop">
                        <input type="text" onChange={(e) => this.handle_doc_change(e, '6_1_1', 'text')} readOnly={state.user.role === 'author-brief'} value={state.doc.data ?  state.doc.data['6_1_1'] : ''} />
                      </div>
                    </div>
                    <div className={`row ${state.is_collpase[41] ? 'collapse': ''}`}>
                      <div className="directive">
                        <strong>Reference or Sample Material to Guide in Design</strong><br/>
                        <span className="small green">Add asset title and hyperlinks</span>
                        <button className="toggle" onClick={(e) => this.collapse(e, 41)}><i className="icon-arrow-up-circle"></i></button>
                      </div>
                      <div className="content has-paddingtop">
                        <input type="text" onChange={(e) => this.handle_doc_change(e, '6_2_1', 'text')} readOnly={state.user.role === 'author-brief'} value={state.doc.data ?  state.doc.data['6_2_1'] : ''} />
                      </div>
                    </div>
                    <div className={`row ${state.is_collpase[42] ? 'collapse': ''}`}>
                      <div className="directive">
                        <strong>Image Suggestions</strong>
                        <button className="toggle" onClick={(e) => this.collapse(e, 42)}><i className="icon-arrow-up-circle"></i></button>
                      </div>
                      <div className="content has-paddingtop">
                        {
                          !state.doc.data['6_3_1'] &&
                          <Dropzone                           
                          onDrop={(files) => this.onDrop(files, '6_3_1')}
                          accept="image/jpeg,image/jpg,image/gif,image/png"
                          multiple={false}
                          >
                          {({getRootProps, getInputProps}) => (
                            <section className="dropzone">
                              <div {...getRootProps()}>
                                <input {...getInputProps()} />
                                <p>
                                  Drag 'n' drop image here, or click to select it
                                </p>
                              </div>
                            </section>
                          )}
                          </Dropzone>
                        }
                        { state.doc.data && state.doc.data['6_3_1'] &&
                          <div className="image">
                            <img src={state.doc.data['6_3_1']} />
                            <button onClick={(e) => this.clear_image('6_3_1')}><i className="icon-close1"></i></button>
                          </div>
                        }
                      </div>
                    </div>
                  </li>
                  <li className={`step-sea ${state.step_close[6] ? 'close' : ''}`}>
                    <legend onClick={(e) => this.close_step(e, 6)}>Step 7: Content Outline or Draft</legend>
                    <div className={`row ${state.is_collpase[43] ? 'collapse': ''}`}>
                      <div className="directive">
                        <strong>Template Outline</strong>
                        <button className="toggle" onClick={(e) => this.collapse(e, 40)}><i className="icon-arrow-up-circle"></i></button>
                      </div>
                      <div className="content has-paddingtop">
                        { state.user.role !== 'author-brief' &&
                          <button className="edit" onClick={(e) => this.open_editor('7_1_1')}>
                            <i className="icon-pencil-alt-solid"></i>
                          </button>
                        }
                        <div className="ql-editor" dangerouslySetInnerHTML={{ __html: state.doc.data['7_1_1'] ?  state.doc.data['7_1_1'] : outline }} />
                      
                      </div>
                    </div>
                  </li>
                </ul>  
                {
                  state.user.role !== 'author-brief' &&
                  <div className="action">
                    <button className="btn-doc-save" onClick={this.save_brief.bind(this)}><i className="icon-save-solid"></i></button>   
                    <button className="btn-delete" onClick={this.delete_brief.bind(this)}><i className="icon-trash-alt-solid"></i></button>
                  </div>
                }
                             
              </section>              
            </>
          }
          {
            (state.showUser || state.is_set_pin) &&
            <section className="user">
              <form className="form" onSubmit={this.handle_user_submit.bind(this)}>
                {
                  state.is_set_pin && state.user && state.user.is_singup &&
                  <>
                    <h1 className="l3-heading">Your Registration is completed!</h1>
                    <p>Now you can access to your app: </p>
                    {
                      ( state.user.role === 'admin' ? 
                      <a href="/">Main App</a> :
                      state.user.role === 'csc' ?
                        <a href="/csc">CSC Optimization App</a> :
                        <a href="/content-brief">Content Brief App</a>
                      )
                    }
                  </>
                }
                {
                  state.is_set_pin && !state.user.is_singup &&
                  <>
                    <h1 className="l3-heading">Registration</h1>
                    <div className="field">
                      <label>Email:</label>
                      <input type="text" onChange={(e) => this.handle_change(e, 'name')} required  />
                    </div>
                    <div className="field">
                      <label>Password:</label>
                      <input type="password" onChange={(e) => this.handle_change(e, 'password')} required  />
                    </div>
                    <button className="button primary">Sign me up</button>
                  </>
                }
                {
                  state.show_createUser &&
                  <>
                    <a className="tertiary back" href="/users">Back to user list</a>
                    <h1 className="l3-heading">Create/Reset a user</h1> 
                    <div className="field">
                      <label>Email:</label>
                      <input type="email" onChange={(e) => this.handle_change(e, 'email')} value={state.user.email} required />
                    </div>
                    <div className="field">
                      <label>Role</label>
                      <select onChange={(e) => this.handle_change(e, 'role')} value={state.user.role} required >
                        <option value=""></option>
                        <option value="admin">Adminstrator</option>
                        <option value="manager-brief">Content Brief Manager</option>
                        <option value="author-brief">Content Brief Author</option>
                        <option value="planview">Content Developer</option>
                        <option value="csc">CSC Editor</option>
                      </select>
                    </div>
                    <div className={`field ${state.user.token ? '': 'hidden'}`}>
                      <label>Planvew email the link below to invite user: {state.user.email}.</label>
                      <span className="reset-link">{window.location.protocol + '//' + window.location.host}/user/{state.user.token}</span>
                    </div>
                    <button className="button primary">Go</button>
                  </>
                }
                {
                  state.showListUser &&
                  <>
                    <ul className="users">
                      <li>
                        <button className="new green" onClick={this.create_user.bind(this)}><i className="icon-plus1"></i> Create a user</button>
                      </li>
                      {
                        state.users.map((item, i) => (
                          <li key={i}>
                            <strong>{item.user.name}</strong>
                            <span>Email: {item.id}</span>
                            <span>Role: {item.user.role}</span>
                            <button className="green" title="reset credential" onClick={(e) => this.reset_user(e, item)}><i className="icon-reload"></i></button>
                            <button className="red" onClick={(e) => this.delete_user(e, item)}><i className="icon-close1"></i></button>
                          </li>
                        ))
                      }
                    </ul>
                  </>
                }
              </form>
            </section>
          }
        </main>
      </section>
    );
  }
}
export default ContentBrief;