import React, { Component } from 'react';
import Progress from 'react-progressbar';
import Dropzone from 'react-dropzone';
import Certificate from './certificate';
import Dungeon301 from './301_dungeon';
import csv from 'csv';
import 'react-notifications/lib/notifications.css';
import {NotificationContainer, NotificationManager} from 'react-notifications';
import Predictive from './predictive';
const axios = require("axios")
const validUrl = require('valid-url');
const async = require('async');
const urlParser = require('url');
// const cloneDeep = require('clone-deep');

// const hostname = "http://localhost:3000";
const hostname = "";


class Redirect extends Component {
  
  constructor(props){
    super(props)
    this.state = {
      filepath: "",
      list: [],
      count: 0, 
      dns: "",
      openModal: false,
      dnsInvalid: false,
      auditMode: false,
      originalList: [],
      hopsList: [],
      busy: false,
      certActive: false,
      dungeonActive: false,
      predictiveActive: false,
      allowSave: false,
      showDNSList: false,
      savedList: [],
      auditSL: false,
      crawlPlanview: false
    }
    this.checkAll = this.checkAll.bind(this)
    this.showHops = this.showHops.bind(this)
    this.setAppBusy = this.setAppBusy.bind(this)
    this.getDNSItem = this.getDNSItem.bind(this)
    this.certComponent = React.createRef()
  }
  componentDidMount(){
    axios.post(hostname+'/redirect', {
      action: "list_domain"
    }).then(res => {
      this.setState({busy: false})
      if ( res.data ) {
        this.setState({
          savedList: res.data
        })
      }
    })   
  }
  createNotification = (type, message) => {
    switch (type) {
      case 'info':
        NotificationManager.info('Info message');
        break;
      case 'success':
        NotificationManager.success( message, 'Info');
        break;
      case 'warning':
        NotificationManager.warning( message, 'Warning', 3000);
        break;
      case 'error':
        NotificationManager.warning( message, 'Error', 3000);
        break;
      }
  }
  handleFileChange(event) {
    if (validUrl.isUri(event.target.value)) {
      let host = urlParser.parse(event.target.value)
      this.setState({
        filepath: host.pathname,
        dns: host.protocol + '//' + host.hostname
      });
    }else{
      this.setState({
        filepath: event.target.value
      });
    }
  }
  handleDNSChange(event) {
    this.setState({dns: event.target.value});
  }
  async doVerify(){
    let filepath = this.state.dns + this.state.filepath
    if (validUrl.isUri(filepath)) {
      
      this.setState({busy: true})
      let data = await axios.post(hostname+'/redirect', {
        action: "get-file",        
        filepath: filepath
      }).then(res => {
        this.setState({busy: false})
        return res.data
      })      
      if (data && this.state.dns){
        this.checkAll(data)
      }else{
        this.createNotification('error','file is not good!')
      }
    }else{
      this.createNotification('error','Not valid filepath')
    }
  }
  checkAll(data){
    window.scrollTo(0, 0);
    this.setState({list: [], hopsList: [], busy: true, allowSave: false})
    let tasks = [];
    // console.log(data)
    data.forEach((item) => {
      if (item.oldurl && validUrl.isUri(this.state.dns + item.oldurl) && validUrl.isUri(item.redirect)){ 
        tasks.push( cb => {
          axios.post(hostname + '/redirect',{
            action: "verify",
            dns : this.state.dns,
            url: item
          }).then(res => {
            let newList = this.state.list 
            newList.push(res.data)
            this.setState({
              list: newList,
              count: (newList.length * 100) / data.length
            })
            cb(null, res.data)
          })
        })
      }
    });
    async.parallel(tasks, (err, results) => {
      this.setState({busy: false, allowSave: true})
      this.createNotification('success', 'Verify complete!')
    })
  }
  openDropZone(){
    if (this.state.dns){
      this.setState({
        openModal: true,
        dnsInvalid: false
      })
    }else{
      this.setState({dnsInvalid: true})
    }
  }
  closeModal(){
    this.setState({openModal: false})
  }
  onDrop(e) {
    const reader = new FileReader();
    this.setState({
      openModal: false
    })
    let that = this
    reader.onload = () => {
      csv.parse(reader.result, (err, data) => {
        console.log(data);
        let urls = data.map(item => {
          return {
            'oldurl': item[0],
            'redirect': item[1]
          }
        })
        if (urls && that.state.dns){
          that.checkAll(urls)
        }else{
          alert('file is not good!')
        }
      })
    };
    reader.readAsBinaryString(e[0]);
  }
  async showHops(key, url){
    this.setState({busy: true})
    let data = await axios.post(hostname+'/redirect', {
      action: "get-trail",        
      url: url
    }).then(res => {
      return res.data
    }) 
    this.setState({
      hopsList:{
        [key]: data
      },
      busy: false
    })
    // console.log(this.state.hopsList)
  }
  save(){
    if (this.state.list.length > 1){
      let host;
      let saveList = this.state.list.map(item => {
        host = urlParser.parse(item.source)
        return {
          oldurl: host.pathname,
          redirect: item.target
        }
      })
      this.setState({busy: true})
      axios.post(hostname+'/redirect', {
        action: "save",        
        host: this.state.dns,
        list: saveList
      }).then(res => {
        let addSavedList = this.state.savedList.filter(item => item !== host.hostname)
        addSavedList.push(host.hostname)
        if ( res.data ) {
          this.createNotification('success', 'Redirect List is saved!')
        }else{
          this.createNotification('error', 'Something wrong!')
        }
        this.setState({busy: false, savedList: addSavedList})
      })      
    }
  }
  showIssue(){
    if(this.state.list.length > 0){
      if (this.state.auditMode){
        let auditList = this.state.list.map(item => {
          let host = urlParser.parse(item.source)
          return {
            oldurl: host.pathname,
            redirect: item.target
          }
        })
        this.checkAll(auditList)
      }else{
        let issueList = this.state.list.filter(item => {
          return item.count > 1 || !item.match || item.status !== 301
        })
        if (issueList.length > 0){
          this.setState({
            auditMode: !this.state.auditMode,
            list: issueList,
            originalList: this.state.list
          })
        }else{
          this.createNotification('warning', 'There is no issue!')
        }
      }
    }else{
      this.createNotification('warning', 'Redirect list is empty!')
    }
  }
  resetList(){
    if (this.state.originalList.length > 0){
      this.setState({
        auditMode: false,
        list: this.state.originalList
      }, () => {
        this.setState({
          originalList: []
        })
      })
    }else{
      this.createNotification('warning', 'Nothing to reset!')
    }
  }
  openCertDashboard(){
    this.setState({certActive: !this.state.certActive, predictiveActive: false, dungeonActive: false})
    if (!this.state.certActive) {
      this.setState({  busy: true })
      axios.post('/certificate', {
        action: "list_domain"
      }).then(res => {
        this.certComponent.current.initList(res.data)
        this.setState({  busy: false })
      })   
    }
  }
  openPredictiveDashboard(){
    this.setState({
      predictiveActive: !this.state.predictiveActive,
      certActive: false,
      dungeonActive: false
    })
  }
  openDungeonDashboard(){
    this.setState({
      dungeonActive: !this.state.dungeonActive,
      certActive: false,
      predictiveActive: false
    })    
  }
  refresh_cert(){
    this.setState({  busy: true })
    axios.post('/certificate', {
      action: "refresh_cert_list"
    }).then(res => {
      this.certComponent.current.initList(res.data.sort((a,b) => {
        return a.host.localeCompare(b.host)
      }))
      this.setState({  busy: false })
    })   
  }
  audit_smartling_swap(){
    let that = this
    axios.get('https://search-admin.planview.com/swap_queen').then(()=>{
      that.setState({auditSL: true})
    }).catch(err =>  console.log(err))
  }
  crawl_planview(){
    let that = this
    axios.post('https://search-admin.planview.com/api/crawl', {
      target: "planview"
    }).then(()=>{
      that.setState({crawlPlanview: true})
    }).catch(err =>  console.log(err))
  }
  setAppBusy(busy){
    this.setState({busy: busy})
  }
  showDNSDropdown(){
    this.setState({showDNSList: !this.state.showDNSList})
  }
  getDNSItem(dns){
    this.setState({busy: true, dns: "https://" + dns})
    axios.post(hostname+'/redirect', {
      action: "get_item",        
      host: dns
    }).then(res => {
      this.setState({busy: false, showDNSList: false})
      if ( res.data ) {
        this.checkAll(res.data.Item.data)
      }else{
        this.createNotification('error', 'Something wrong!')
      }
    })      
  }
  render() {
    return ( 
      <section className="redirect-container">
        <NotificationContainer/>
        <main className={(this.state.certActive ? 'cert-active' : '') + (this.state.predictiveActive ? ' predict-active' : '') + (this.state.dungeonActive ? ' dungeon-active' : '') }>          
          <header>            
            <h1 className="l3-heading">Redirect King</h1>
            <div className="header">
              <input className={"dns " + (this.state.dnsInvalid ? 'invalid': '')} type="text" value={this.state.dns} onChange={this.handleDNSChange.bind(this)} placeholder="https://www.planview.com"/>
              <input className="filepath" type="text" value={this.state.filepath} onChange={this.handleFileChange.bind(this)} placeholder="https://www.planview.com/path-to-file.csv"/>
              <button className="btn-verify" onClick={this.doVerify.bind(this)}><span className="icon-check-circle-light"></span></button>
              <button className="btn-drop" onClick={this.openDropZone.bind(this)}><span className="icon-layers"></span></button>
            </div>
            <Progress completed={this.state.count} />
          </header>    
          { this.state.auditSL &&
            <p>Please check <a href="https://planview.slack.com/archives/G01656NFRC5" target="_blank" rel="noopener noreferrer">domadmin-bug-report</a></p>
          }      
          { this.state.crawlPlanview &&
            <p>Let the process begin and may the power be with you!</p>
          }      
          <ul className="list">
            {
              this.state.list.map( (item,index) => (
                <>
                  {
                    item.status === 301 &&
                    <li key={index} className={(item.match ? 'match ': 'not-match ') + (item.count > 1 ? 'many-hops' : '')}>
                      {
                        item.count === 1 && <i className="hop icon-checkmark"></i>
                      }
                      {
                        item.count > 1 && <button className="hop" onClick={() => {this.showHops(index, item.source)}}>{item.count} hops</button>
                      }
                                  
                      <p><span>Original Url:</span> <a href={item.source} target="_blank" rel="noopener noreferrer">{item.source}</a></p>
                      {
                        !item.match &&
                        <React.Fragment>
                          <p><span>CSV Redirect:</span> <a href={item.target} target="_blank" rel="noopener noreferrer">{item.target}</a></p>
                          <p><span>Actual Redirect:</span> <a href={item.redirect} target="_blank" rel="noopener noreferrer">{item.redirect}</a></p>
                        </React.Fragment>
                      }
                      {
                        item.count > 1 && this.state.hopsList[index] &&
                        <ol>
                          {

                            this.state.hopsList[index].map((e, i) => (
                              <li key={i}><a href={e}  target="_blank" rel="noopener noreferrer">{e}</a></li>
                            ))
                          }
                          
                        </ol>
                      }
                    </li>
                  }
                  { item.status !== 301 &&
                    <li key={index} className="not-match">
                      <span className="red">{item.status}</span>
                      <p><span>Original Url:</span> <a href={item.source} target="_blank" rel="noopener noreferrer">{item.source}</a></p>
                      <p><span>Target:</span> <a href={item.target} target="_blank" rel="noopener noreferrer">{item.target}</a></p>
                    </li>
                  }
                </>
              ))
            }
          </ul>
          <div className={"modal " + (this.state.openModal ? 'open': '')}>
            <button onClick={this.closeModal.bind(this)}><i className="icon-close-x"></i></button>
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
        </main>
        <aside className={this.state.busy ? 'busy' : ''}>
          <div className="logo">
            <img className="front" src="/301-redirect-sign.png" alt="" />
            <img className="back" src="/404-sign.png" alt="" />
          </div>
          <ul className="action-list">
            <li>
              <button onClick={this.openCertDashboard.bind(this)} title="Certificate Dashboard" className={this.state.certActive ? 'cert-active' : ''}><i className="icon-feed"></i></button>
            </li>
            <li>
              <button onClick={this.openPredictiveDashboard.bind(this)} title="Predictive Prefetch Dashboard" className={this.state.predictiveActive ? 'predict-active' : ''}><i className="icon-energy"></i></button>
            </li>
            <li>
              <button onClick={this.openDungeonDashboard.bind(this)} title="301 Dungeon Dashboard" className={this.state.dungeonActive ? 'dungeon-active' : ''}><i className="icon-social-steam"></i></button>
            </li>
            <li>
              <button onClick={this.audit_smartling_swap.bind(this)} title="Audit Smartling Swap"><i className="icon-shuffle"></i></button>
            </li>
            <li>
              <button onClick={this.crawl_planview.bind(this)} title="Crawl Planview Search Result"><i className="icon-cogs-regular"></i></button>
            </li>
            { !this.state.certActive && !this.state.predictiveActive && !this.state.dungeonActive &&
              <React.Fragment>
                <li>
                  <button onClick={this.resetList.bind(this)} title="Reset list"><i className="icon-action-undo"></i></button>
                </li>
                <li>
                  { !this.state.auditMode &&
                    <button onClick={this.showIssue.bind(this)} title="View issue only"><i className="icon-list"></i></button>
                  }
                  {
                    this.state.auditMode &&
                    <button onClick={this.showIssue.bind(this)} title="Audit issue redirects"><i className="icon-lifecycles-grey"></i></button>                
                  }
                  
                </li>
                <li className={"has-menu" + (this.state.showDNSList ? ' active' : '')}>
                  <button onClick={this.showDNSDropdown.bind(this)} title="Get redirect from existing domain"><i className="icon-share"></i></button>
                  <ul className="dns-list">
                    {
                      this.state.savedList.map((item,i) => (
                        <li key={i}><button onClick={()=> this.getDNSItem(item)}>{item}</button></li>
                      ))
                    }
                  </ul>
                </li>
                {
                  !this.state.auditMode && this.state.list.length > 1 && this.state.allowSave &&
                  <li><button onClick={this.save.bind(this)} title={"Save list to "+ this.state.dns}><i className="icon-drawar"></i></button></li>
                }
              </React.Fragment>              
            }
            {
              this.state.certActive &&
              <li><button title="Audit list" onClick={this.refresh_cert.bind(this)}><i className="icon-loop"></i></button></li>
            }
          </ul>          
        </aside>        
        <Certificate ref={this.certComponent} notification={this.createNotification} setBusy={this.setAppBusy} />
        <Predictive notification={this.createNotification} setBusy={this.setAppBusy} />
        <Dungeon301 notification={this.createNotification}/>
        <footer>
          <p>Copyright &copy; 2020. Planview, Inc. All Rights Reserved.</p>
        </footer>
      </section>
    )
  }
}
export default Redirect;