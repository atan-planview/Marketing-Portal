import React, { Component } from 'react';
import jQCloud from 'jqcloud2';
import $ from 'jquery';

export default class WordCloud extends Component {
  constructor(props) {
    super(props);

    this.state = { 
      word_array: this.props.word_array || [],
      jqStyle: this.props.jqStyle || { width: '50vw', height: '50vh' },
      jqID: this.props.jqID || 'jqcloud',
      colors: this.props.colors || ["#4297fc", "#3e2ec2", "#ff3000", "#1a1b2f", "#680b18", "#ffa943", "#09aa61", "#ab33dd", "#513dff"],
      fontSize: this.props.fontSize || {from: 0.1,to: 0.02}
    }
  }

  componentDidMount() {
    this._wordCloud();
  }

  _wordCloud() {  
    let that = this
    $(this._cloud).jQCloud(this.state.word_array, {
                        classPattern: null,
                        colors: this.state.colors,
                        fontSize: this.state.fontSize,
                        autoResize: true,
                        width: 1008,
                        height: this.state.word_array.length > 50 && this.state.word_array.length < 70 ?  this.state.word_array.length * 10 : (this.state.word_array.length >= 100 ? 700 : 500)
                        })
    let id = '#'+ $(this._cloud).attr('id')
    $(document).delegate(id +' .jqcloud-word a', 'click', e => {
      e.preventDefault()
      // console.log(e.target.href)
      that.props.fillInput(e.target.href)
    })
  }

  render() {
    return (
      <div ref={a => this._cloud = a} id={this.state.jqID} style={this.state.jqStyle}>
        {!this.state.word_array.length && 
          <div
            style={{
              textAlign: "center",
              fontSize: "20px",
              color: "#777777",
              padding: "25px 20px",
              border: "1px dashed #1c1c1c"
            }}
          >Please enter url of a page to generate cloud!</div>}
      </div>
    );
  }
}