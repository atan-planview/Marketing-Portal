import React, { Component } from 'react';

const hostname = "";


class Dashboard extends Component {
  
  constructor(props){
    super(props)
    this.state = {
      
    }
    
  }
  componentDidMount(){
    
  }
  
  render() {
    return ( 
      <section className="dashboard">
        <div className="container">
          <ul>
            <li onClick={() => {window.location = '/dmo'}}>
              <h2>Digital Marketing Tools</h2>
              <span className="icon icon-shuffle"></span>
            </li>
            <li onClick={() => {window.location = '/csc'}}>
              <h2>Customer Success Images Optimizer</h2>
              <span className="icon icon-picture"></span>
            </li>
            <li onClick={() => {window.location = '/content-brief'}}>
              <h2>Marketing Content Brife</h2>
              <span className="icon icon-blog-bright-red"></span>
            </li>
            <li onClick={() => {window.location = '/users'}}>
              <h2>Marketing Users Managment</h2>
              <span className="icon icon-users-regular"></span>
            </li>
            <li onClick={() => {window.location = 'https://search-admin.planview.com/'}}>
              <h2>Search Result Managment</h2>
              <span className="icon icon-partner-finder"></span>
            </li>
            <li onClick={() => {window.location = 'https://surveys.planview.com/review/'}}>
              <h2>Planview Reviews Managment</h2>
              <span className="icon icon-star-half-alt-solid"></span>
            </li>
            <li onClick={() => {window.location = 'https://surveys.planview.com/'}}>
              <h2>Pathfinder Survey Data</h2>
              <span className="icon icon-solution-demo"></span>
            </li>
            <li onClick={() => {window.location = '/smartling'}}>
              <h2>Smartling Tools</h2>
              <span className="icon icon-social-behance"></span>
            </li>
            <li onClick={() => {window.location = '/capability'}}>
              <h2>Capability Map Management</h2>
              <span className="icon icon-map"></span>
            </li>
          </ul>
        </div>
        <footer>
          <p>Copyright &copy; 2020. Planview, Inc. All Rights Reserved.</p>
        </footer>
      </section>
    )
  }
}
export default Dashboard;