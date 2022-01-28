import React, { useState } from 'react';
import RedirectApp from './component/redirect'
import Dashboard from './component/dashboard'
import Smartling from './component/smartling'
import Capability from './component/capability'
import CSC from './component/csc'
import ContentBrief from './component/content-brief'
import cookie from 'react-cookies'

import { Route, BrowserRouter as Router, Redirect,
  useHistory,
  useLocation } from 'react-router-dom';

const axios = require("axios")
// const host = "http://localhost:4000"
const host = ""
function App() {
  return (
    <div className="App">
      <Router>
        <Route exact path = "/" component={Dashboard} />
        <PrivateRoute path = "/dmo" component={RedirectApp} />
        <PrivateRoute path = "/csc" component={CSC} />
        <PrivateRoute path = "/smartling" component={Smartling} />
        <PrivateRoute path = "/capability" component={Capability} />
        <PrivateRoute exact path = "/content-brief/:id?" component={ContentBrief} />
        <PrivateRoute path = "/users" component={ContentBrief} />
        <Route path="/login">
          <LoginPage /> 
        </Route>
        <Route path= "/user/:token" component={ContentBrief} />
      </Router>
    </div> 
  );
}

function PrivateRoute({ component: Component, ...rest }) {
  // console.log(fakeAuth.isAuthenticated)
  return (
    <Route
      {...rest}
      render={props =>
        fakeAuth.isAuthenticated && fakeAuth.isAuthenticated.role === 'admin' ? (
          <Component {...props} />
        ) : 
        rest.path.indexOf('/csc') >= 0 && fakeAuth.isAuthenticated && ( fakeAuth.isAuthenticated.role === 'csc') ? (
          <Component {...props} />
        ) : 
        rest.path.indexOf('/content-brief') >= 0 && fakeAuth.isAuthenticated && ( fakeAuth.isAuthenticated.role === 'manager-brief' || fakeAuth.isAuthenticated.role === 'author-brief' || fakeAuth.isAuthenticated.role === 'planview') ? (
          <Component {...props} />
        ) : 
        rest.path.indexOf('/capability') >= 0 && fakeAuth.isAuthenticated && ( fakeAuth.isAuthenticated.role === 'manager-brief' || fakeAuth.isAuthenticated.role === 'planview') ? (
          <Component {...props} />
        ) : 
        (
          <Redirect
            to={{
              pathname: "/login", 
              state: { from: props.location }
            }}
          />
        )
      }
    />
  );
}
function LoginPage() {
  const [notification, setState] = useState({});
  const [state, setSignupState] = useState({is_signup: false, is_done: false});
  let history = useHistory();
  let location = useLocation();

  let { from } = location.state || { from: { pathname: "/" } };
  let user={}
  let hand_change = (e, type) => {
    user[type] = e.target.value
  }
  let login = (e) => {
    e.preventDefault()
    fakeAuth.authenticate(user, function(res){
      // console.log(res)
      if (res){        
        setState({type: true, msg:'Success! Please go back to your designated APP.'})
        console.log(from.pathname)
        window.location = from.pathname;
        // if (from.pathname !== '/' && from.pathname !== '/login'){
        // }else{
        //   window.location = from.pathname;
        // }
      }else{
        console.log(res)
        setState({type: false, msg: 'You have entered an invalid credential. Please try again, or contact administrator for access.'})
      }
    });
  }
  let signup = (e) => {
    e.preventDefault()
    console.log(1)
    setSignupState({is_signup: true})
  }
  let request = (e) => {
    e.preventDefault()
    axios.post('/user',{
      action: 'request-login',
      user: user
    }).then(res => {      
      if(res.status == 200){        
        setSignupState({is_done: true, is_signup: true})
      }
    }).catch(err => {
      // cb(false)
    })
  }
  return (
    <div className="portal">
      <img className="logo" src="https://d1ru3055gppavs.cloudfront.net/img/logo-planview-full-color.svg" />
      { !state.is_signup &&
        <form className="login-form" onSubmit={(e) => login(e)}>
          {
            notification.msg &&
            <div className={`msg ${notification.type ? 'green': ''}`}>{notification.msg}</div>
          }
          <label>Email</label><br />
          <input type="email" onChange={(e) => hand_change(e, 'email')} required /><br/><br/>
          <label>Password</label><br />
          <input type="password" onChange={(e) => hand_change(e, 'password')} required /><br/><br/>
          <button className="button primary">Log In</button>
          <br/>
          <p>Don't have account? <a href="#" onClick={(e) => signup(e)}>signup</a></p>
        </form>
      }
      {
        state.is_signup && 
        <form className="login-form" onSubmit={(e) => request(e)}>
          {
            !state.is_done &&
            <>
              <h1 className="l3-heading">Request Login</h1>
              <label>Email</label><br />
              <input type="email" onChange={(e) => hand_change(e, 'email')} required /><br/><br/>
              <label>Reason for requesting</label><br />
              <textarea rows="6" onChange={(e) => hand_change(e, 'msg')} required ></textarea><br/><br/>
              <button className="button primary">Send Request</button>
            </>
          }
          {
            state.is_done &&
            <p>We will get back to you shortly, if approved, we will reach out to you with a link to setup your login credential.</p>
          }
        </form>
      }
    </div>
  );
}
const fakeAuth = {
  isAuthenticated: cookie.load('pv-marketing'),
  authenticate(user, cb) {
    // console.log(user)
    if (user.password){
      axios.post(host+'/user',{
        action: 'authenticate',
        user: user
      }).then(res => {      
        // console.log(res)
        if(res.status == 200){
          let user = res.data
          fakeAuth.isAuthenticated = user.role;

          cookie.save('pv-marketing', {role: user.role, name: user.name}, { path: '/', maxAge: 3600 * 24});

          cb(true)
        }else{
          cb(false)
        }
      }).catch(err => {
        cb(false)
      })
    }
  },
  signout() {
    fakeAuth.isAuthenticated = false;
    cookie.remove('pv-marketing', { path: '/' })
  }
};
export default App;
