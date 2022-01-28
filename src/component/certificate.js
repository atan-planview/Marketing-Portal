import React, { Component } from 'react';
import ReactJson from 'react-json-view'
const validUrl = require('valid-url');
const axios = require("axios")

class Certificate extends Component {
  constructor(props){
    super(props)
    this.state = {
      dns: '',
      lsDns: [],
      itemJSON: {},
      modalActive: false
    }
    this.initList = this.initList.bind(this)
    this.showInfo = this.showInfo.bind(this)
    this.sort = this.sort.bind(this)
  }
  handleChange(e){
    this.setState({dns: e.target.value})
  }
  async addDNS(){
    this.props.setBusy(true)
    let protocol= 'https://'
    if (this.state.dns && validUrl.isUri(protocol + this.state.dns)) {
      let data = await axios.post('/certificate', {
        action: "save",        
        dns: this.state.dns
      }).then(res => {
        return res.data
      })   
      if (data.host){
        let newList = this.state.lsDns.filter(item => item.host !== data.host)
        newList.push(data)
        this.setState({
          lsDns: newList.sort((a,b) => a.host.localeCompare(b.host))
        })
      }else{
        this.props.notification('error', 'Something wrong, server error!')
      }
      this.props.setBusy(false)
    }else{
      this.props.notification('warning', "Not valid Url!")
      this.props.setBusy(false)
    }
  }
  initList(lsDns){
    this.setState({lsDns})
  }
  showInfo(item){
    let x = document.getElementsByTagName("BODY")[0];
    x.classList.add("fixed")
    this.setState({itemJSON: item, modalActive: true})
  }
  closeModal(){
    let x = document.getElementsByTagName("BODY")[0];
    x.classList.remove("fixed")
    this.setState({modalActive: false})
  }
  sort(option){
    let sortList = []
    switch(option){
      case 'cert':
        sortList = this.state.lsDns.sort((a,b)=> a.certDaysLeft > b.certDaysLeft ? 1 : -1 )
        this.setState({lsDns: sortList})
        break
      case 'issuer':
        sortList = this.state.lsDns.sort((a,b)=> {
          if (a.cert && b.cert && a.cert.issuer && b.cert.issuer){
            return a.cert.issuer.O.localeCompare(b.cert.issuer.O) 
          }else{
            return 1
          }
        })
        this.setState({lsDns: sortList})
        break
      case 'registar':
        sortList = this.state.lsDns.sort((a,b)=> {
          if (a.whoiser && b.whoiser && a.whoiser.Registrar.name  && b.whoiser.Registrar.name){
            return a.whoiser.Registrar.name.localeCompare(b.whoiser.Registrar.name) 
          }else{
            return 1
          }
        })
        this.setState({lsDns: sortList})
        break
      case 'whoiser':
        sortList = this.state.lsDns.sort((a,b)=> a.whoiserDaysLeft > b.whoiserDaysLeft ? 1 : -1 )
        this.setState({lsDns: sortList})
        break
      default: 
        sortList = this.state.lsDns.sort((a,b)=> a.host.localeCompare(b.host))
        this.setState({lsDns: sortList})
    }
  }
  render() {
    return(
      <div className="certificate">
        <div className="main">
          <h2 className="l3-heading">Domain King</h2>
          <div className="input-wrapper">
            <label>Domain</label>
            <input type="text" value={this.state.dns} onChange={this.handleChange.bind(this)} placeholder="www.planview.com" />
            <button onClick={this.addDNS.bind(this)}><i className="icon-plus-regular"></i></button>
          </div>
          <h3 className="l5-heading">{this.state.lsDns.length} domains</h3>
          <table>
            <thead>
              <tr>
                <th className="has-button">Domain <button onClick={() => this.sort('domain')}><i className="icon-equalizer"></i></button></th>
                <th className="has-button">Issuer <button onClick={() => this.sort('issuer')}><i className="icon-equalizer"></i></button></th>
                <th>Cert Valid To</th>
                <th className="has-button">Days Left <button onClick={() => this.sort('cert')}><i className="icon-equalizer"></i></button></th>
                <th className="has-button">Registrar <button onClick={() => this.sort('registar')}><i className="icon-equalizer"></i></button></th>
                <th>DNS Valid To</th>
                <th className="has-button">Days Left <button onClick={() => this.sort('whoiser')}><i className="icon-equalizer"></i></button></th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {
                this.state.lsDns.map((item, i) => (
                  <tr key={i} 
                    className={(item.err ? 'error ' : '') + (item.certDaysLeft < 30 || (item.whoiserDaysLeft > 0 && item.whoiserDaysLeft < 30) ? 'warn' : '')} >
                    <td>{item.host}</td>
                    { !item.err &&
                      <React.Fragment>
                        <td>{item.cert.issuer.O}</td>
                        <td className="right">{item.certValidTo}</td>
                        <td className="right">{item.certDaysLeft}</td>  
                        { item.whoiser && 
                          <React.Fragment>
                            <td>{item.whoiser.Registrar? item.whoiser.Registrar.name : ''}</td>              
                            <td className="right">{item.whoiserValidTo}</td>
                            <td className="right">{item.whoiserDaysLeft}</td>    
                            <td><button onClick={() => this.showInfo(item)}><i className="icon-options"></i></button></td>            
                          </React.Fragment>
                        }
                      </React.Fragment>
                    }
                    {
                      item.err && <td colSpan="3">{item.err}</td>
                    }
                  </tr>
                ))
              }
            </tbody>
          </table>
          <div className={"popup" + (this.state.modalActive ? ' active': '')}>
            <button onClick={this.closeModal.bind(this)}><i className="icon-close-x"></i></button>
            <ReactJson src={this.state.itemJSON} theme="monokai" />
          </div>
        </div>
      </div>
    );
  }
}
export default Certificate;