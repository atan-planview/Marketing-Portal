import React, { Component } from 'react';
import WordCloud from './view_cloud';
const validUrl = require('valid-url');
const axios = require("axios")
const urlParser = require('url');
const path = require('path');

class Predictive extends Component {
  constructor(props){
    super(props)
    this.state = {
      url: '',
      data: [],
      views: 0
    }
    this.wordCloud = React.createRef()
    this.fillInput = this.fillInput.bind(this)
  }
  async componentDidMount(){
    let data = await axios.post('/predictive', {
      action: 'top_ten'
    }).then(res => {
      return res.data
    })
    if ( data.length > 0){
      this.setState({
        views: 1,
        data: data.map(item => ({
          text: (item.page === '/' ? 'Homepage' : (item.page === '/se/' ? 'SE Homepage' : (item.page === '/no/' ? 'NO Homepage' : path.basename(item.page)))) + 
                  `<span class="chances">${item.score}</span>`,
          weight: item.score,
          link: this.isLocalUrl(item.page) ? 'http://www.planview.com' + item.page : item.page.substr(1)
        }))
      })
    }
  }
  handleChange(e){
    this.setState({url: e.target.value})
  }
  async search(){
    this.setState({
      views: 0,
      data: [] 
    })
    if (this.state.url && validUrl.isUri(this.state.url)) {
      this.props.setBusy(true)
      let pagePath = urlParser.parse(this.state.url)
      let data = await axios.post('/predictive', {
        action: 'get_next_page',
        payload: pagePath.pathname
      }).then(res => {
        return res.data
      })
      if (data.length > 0){
        // console.log(data[0].nextPages.length)
        this.setState({
          views: data[0].nextPageviews,
          data: data[0].nextPages.map(item => ({ 
            text: (item.pagePath === '/' ? 'Homepage' : (item.pagePath === '/se/' ? 'SE Homepage' : (item.pagePath === '/no/' ? 'NO Homepage' : path.basename(item.pagePath)))) + 
              (item.views > 10 ? `<span class="chances">${item.views}</span>` : ''),
            weight: item.views,
            link: this.isLocalUrl(item.pagePath) ? pagePath.protocol +'//'+ pagePath.hostname + item.pagePath : item.pagePath.substr(1)
          }))
        })
      }else{
        this.props.notification('warning', 'No predication available at this time!')
      }
      this.props.setBusy(false)
    }
  }
  isLocalUrl(url){
    return !(url.indexOf('planview.com') > 1)
  }
  fillInput(value){
    this.setState({url: value})
  }
  render() {
    return(
      <div className="predictive">
        <h2 className="l3-heading">Predictive Prefetch</h2>
        <div className="input-wrapper">
          <label>Page URL</label>
          <input type="text" value={this.state.url} onChange={this.handleChange.bind(this)} placeholder="https://www.planview.com/demo/" />
          <button onClick={this.search.bind(this)}><i className="icon-search-regular"></i></button>
        </div>
        <div className="main">
          { this.state.views > 0 &&
            <>
              <h2 className="l5-heading">30 days traffics</h2>
              {
                this.state.views === 1 &&
                <p>Top pages on www.planview.com</p>
              }
              {
                this.state.views > 1 &&
                <p>{this.state.views} of viewers visited these pages: </p>
              }
              <WordCloud ref={this.wordCloud} word_array={this.state.data} fillInput={this.fillInput} />
            </>
          }
        </div>
      </div>
    );
  }
}
export default Predictive;