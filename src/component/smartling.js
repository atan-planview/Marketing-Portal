import React, { Component } from 'react';
const axios = require("axios")

const hostname = "";


class Smartling extends Component {
  
  constructor(props){
    super(props)
    this.state = {
      rules: [],
      busy: false,
      results: []
    }
    
  }
  componentDidMount(){
    let that = this
    axios.get('https://search-admin.planview.com/sl_rules').then(res => {
      this.setState({busy: true})
      if ( res.data ) {
        that.setState({rules: res.data, busy: false, results: res.data})
      }
    }) 
  }
  handleChange(e){
    let word= e.target.value
    if (e.keyCode === 13){
      let results = this.state.rules.filter((item, i) => {
        let temp = `${item.id}--${item.condition}--${item.rewriteSearch}--${item.rewriteReplace}`
        return temp.includes(word)
      })
      this.setState({results})
    }
  }
  render() {
    let state = this.state
    return ( 
      <section className="smartling">
        <div className="container">
          <header>
            <input type="text" onKeyUp={this.handleChange.bind(this)} />
          </header>
          <main>
            <p>Found: {state.results.length}</p>
            <ul className="results">
              {
                state.results.map((item, i) => (
                  <li key={i}>
                    <span>ID: <strong>{item.id}</strong></span>
                    <span>Condition: {item.condition}</span>
                    <span>Search: {item.rewriteSearch}</span>
                    <span>Replace: {item.rewriteReplace}</span>
                  </li>
                ))
              }
            </ul>
          </main>
        </div>
        <footer>
          <p>Copyright &copy; 2020. Planview, Inc. All Rights Reserved.</p>
        </footer>
      </section>
    )
  }
}
export default Smartling;