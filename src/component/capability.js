import { forEachOf } from 'async';
import { stat } from 'fs';
import React, { Component } from 'react';
import ReactQuill from 'react-quill';
const axios = require("axios")

// supporting capabilites is different once products combine


class Capability extends Component {
  
  constructor(props){
    super(props)
    this.state = {
      data: {},
      slide: 0
    }
    this.save_data = this.save_data.bind(this)
    this.get_data = this.get_data.bind(this)
  }
  componentDidMount(){
    this.get_data()
    //--------- Auto Save -----------------------------
    var intervalId = setInterval(this.get_data, 90000);
    this.setState({intervalId: intervalId});
  }
  componentWillUnmount() {
    clearInterval(this.state.intervalId);
  }
  get_data(){
    let that = this    
    axios.post('/capability', {
      action: 'data'
    })
    .then(function (response) {
      that.setState({data: response.data})
    })
    .catch(function (error) {
      console.log(error);
    });
  }
  save_data(){
    let that = this
    axios.post('/capability', {
      action: 'save',
      data: that.state.data
    })
    .then(function (res) {
      // console.log(res.data)
      that.setState({data: res.data})
    })
    .catch(function (error) {
      console.log(error);
    });
  }
  handleChange(e, target){
    let state = this.state
    state[target] = parseInt(e.target.value)
    this.setState(state)
  }
  add_capability(){
    let state = this.state
    if (state['cap_add'] && window.confirm("Do you want to add?") == true){
      if (state['prod']){
        let all = state.data.products1.concat(state.data.products2)
        all.forEach(item => {
          if (item.id === state['prod']){
            let found = item.capability.filter(e => e === state['cap_add'])
            if (found.length <= 0){
              item.capability.push(state['cap_add'])  
              state['prod'] = false                   
            }
          }
        })
        this.setState(state, ()=>{
          this.save_data()
        })
      }
    }
  }
  remove_capability(prod, cap){
    let state = this.state
    // console.log(prod, cap)
    if (window.confirm("Do you want to delete?")){
      let all = state.data.products1.concat(state.data.products2)
      cap = parseInt(cap)
      all.forEach(item => {
        if (item.id === prod){
          let found = item.capability.filter(e => e != cap)
          if (found.length >= 0){
            item.capability = found       
          }
        }
      })
      this.setState(state, ()=>{
        this.save_data()
      })
    }
  }
  list_capabilities(){
    let all = this.state.data.portfolio.concat(this.state.data.work).concat(this.state.data.ctas)
    let list = []
    all.forEach((item) => {
      item.rows.forEach(e => {
        if (e && e.header){
          list.push(e)
        }
      })
    })
    return list.sort((a,b) => (a.header > b.header) ? 1 : ((b.header > a.header) ? -1 : 0))
  }
  get_capability_name(id){
    let all = this.state.data.portfolio.concat(this.state.data.work).concat(this.state.data.ctas)
    let cap = {}
    all.forEach((item) => {
      item.rows.forEach(e => {
        if (e && e.id === id){
          cap = e;
          return;
        }
      })
    })
    return cap;
  }
  get_supporting(id){
    let state = this.state.data
    let all = state.products1.concat(state.products2)
    let prods = all.filter(item => item.id === id)
    if (prods.length > 0)
    return prods[0]
    return false
  }
  remove_support(prod, id){
    if (window.confirm('Do you want to remove the complementary product?')){
      let state = this.state
      state.data.products1.forEach(item => {
        if(item.id === prod){
          let supports = item.support.filter(e => e !== id)
          item.support = supports
        }
      })
      this.setState(state, ()=>{
        this.save_data()
      })
    }
  }
  add_support(){
    if (window.confirm('Do you want to add the complementary product?')){
      let state = this.state
      state.data.products1.forEach(item => {
        if(item.id === state.is_support){
          if(item.support){
            let found = item.support.filter(e => e === state['sup_add'])
            if (found.length <= 0){
              item.support.push(state.sup_add)
              state['is_support'] = false
            }
          }else{
            item.support = []
            item.support.push(state.sup_add)
            state['is_support'] = false
          }
        }
      })
      this.setState(state, ()=>{
        this.save_data()
      })
    }
    
  }
  p_clean_cap(cap){
    let state = this.state
    let all = state.data.products1.concat(state.data.products2)
    all.forEach(prod => {
      let caps = prod.capability.filter(item => item != cap.id)
      prod.capability = caps
    })
    state.data.combination.forEach(item => {
      let caps = item.capability.filter( e => e.cap !== cap.id)
      item.capability = caps
    })
    this.setState(state)
  }
  //-------------------------------------------------------------- Capability
  cm_open_editor(pos){
    let state = this.state.data
    let main_title = state[pos.main][pos.col]['label']
    if ( pos.row >= 0){
      let cap = state[pos.main][pos.col].rows[pos.row] || {}
      this.setState({editor: cap, cap_pos: pos, cap_main_title: main_title})
    }else{
      this.setState({editor: {}, cap_pos: pos, cap_main_title: main_title})
    }
  }
  cm_editor_handle_change(value, target){
    let editor = this.state.editor
    editor[target] = value
    this.setState({editor})
  }
  cm_title_handle_change(value){
    let state = this.state
    state.cap_main_title = value
    state.data[this.state.cap_pos.main][this.state.cap_pos.col]['label'] = value
    this.setState(state)
  }
  cm_save_capability(){
    // save the whole the state.data
    let state = this.state
    if (state['cap_pos'] && window.confirm('Do you want to save?')){
      if (!state.editor.id){
        state.editor['id'] = Date.now()
      }
      if (!state.editor.button_text){
        state.editor['button_text'] = 'Learn More'
      }
      if ( state.cap_pos.row >= 0 ){
        state.data[state.cap_pos.main][state.cap_pos.col].rows[state.cap_pos.row] = state.editor
        state.data[state.cap_pos.main][state.cap_pos.col].rows.sort( (a,b) => (a.order > b.order) ? 1 : ((b.order > a.order) ? -1 : 0))
      }else{
        state.data[state.cap_pos.main][state.cap_pos.col].rows.push(state.editor)
      }
      state['cap_pos']= null
      this.setState(state, ()=>{
        this.save_data()
      })
    }
  }
  cm_remove_capability(){
    let state = this.state
    if (state['cap_pos'] && window.confirm('Do you want to remove this?')){
      
      if ( state.cap_pos.row >= 0 ){
        this.p_clean_cap(state.data[state.cap_pos.main][state.cap_pos.col].rows[state.cap_pos.row])
        state.data[state.cap_pos.main][state.cap_pos.col].rows.splice(state.cap_pos.row, 1)
        if (state.data[state.cap_pos.main][state.cap_pos.col].rows.length == 0) {
          console.log(1)
          state.data[state.cap_pos.main].splice(state.cap_pos.col, 1)
        }
      }
      state['cap_pos']= null
      this.setState(state, ()=>{
        this.save_data()
      })
    }
    
  }
  cm_remove_row(cap){
    if (window.confirm('Do you want to remove this whole row?')){
      let state = this.state
      state.data[cap.main][cap.col].rows.forEach(item => {
        this.p_clean_cap(item)
      })
      state.data[cap.main].splice(cap.col, 1)
      this.setState(state, ()=>{
        this.save_data()
      })
    }
  }
  cm_add_capability(target){
    let state = this.state
    state.data[target].push({"label": "New "+target+" Capability", "rows": [{},{},{},{}]})
    this.setState(state, () =>{
      // this.save_data()
    })
  }
  cm_add_capability_ctas(){
    let state = this.state
    state.data.ctas.push({"rows": [{}]})
    this.setState(state, () =>{
      this.save_data()
    })
  }
  //----------------------------------------------------------------------------------------------------------------------
  m_handle_change(e, target){
    let state = this.state
    state.map[target] = e.target.value
    this.setState(state)
  }
  m_save_map(){
    if (window.confirm('Do you want to save?')){
      this.setState({m_show: false}, () => {
        this.save_data()
      })
    }
  }
  m_handle_change_other(e, target){
    let state = this.state
    state.data.others[target] = e.target.value
    this.setState(state)

  }
  publish(){
    if (window.confirm('Do you want to publish draft?')){
      let that = this
      axios.post('/capability', {
        action: 'publish'
      })
      .then(function (response) {
        that.setState({data: response.data})
      })
      .catch(function (error) {
        console.log(error);
      });
    }
  }
  //---------------------------------- Combine -----------------------
  open_support_combine(prodID){
    let list = []
    this.state.data.products1.forEach(prod => {
      if (prod.id === prodID){
        if (prod.support && prod.support.length > 0) {
          prod.support.forEach(e => {
            let supp = this.get_supporting(e)
            if (supp){
              list.push(supp)
            }
          })
          this.setState({c_prod: prod,c_list: list, slide: 3})
        }
        return
      }
    })
    // this.setState({is_combine: item.id, slide: 3})
  }
  c_selecting_prod(i){
    let c_list = this.state.c_list
    c_list[i]['is_selected'] = !c_list[i]['is_selected']
    this.setState({c_list})
  }
  c_selecting_main_prod(){
    let c_prod = this.state.c_prod
    c_prod['is_selected'] = !c_prod['is_selected']
    this.setState({c_prod})
  }
  c_set_combination(){
    let state = this.state
    if (state.c_prod.is_selected){
      let key = state.c_prod.id
      let prods = []
      prods.push(state.c_prod.title)
      state.c_list.forEach(item => {
        if (item.is_selected){
          key += '-'+item.id
          prods.push(item.title)
        }
      })
      let found = false
      if(!state.data['combination']){
        state.data['combination'] = []
      }else{
        state.data['combination'].forEach(e => {
          if (e.id === key){
            found = true
          }
        })
      }
      if (!found){
        state.data['combination'].push({
          id: key,
          prods: prods,
          capability: []
        })
        state.c_prod.is_selected = false
        state.c_list.forEach(item => item.is_selected= false)
        this.setState(state, ()=>{
          this.save_data()
        })
      }
    }else{
      window.alert('Invalid selection')
    }
  }
  c_add_capability(){
    let state = this.state
    if (state.c_cap_add){
      state.data.combination.forEach(item => {
        if (item.id === state.c_prod_add){
          let found = false
          item.capability.forEach(e => {
            if (e.cap === state.c_cap_add) {
              found = true
            }
          })
          if (!found){
            let prod_id = state.c_cap_hilight || state.c_prod.id
            item.capability.push({
              star: state.c_cap_add_star,
              prod_id: prod_id,
              cap: state.c_cap_add
            })
            state['c_prod_add']= false
            state['c_cap_add_star']= false
            this.setState(state, ()=>{
              this.save_data()
            })
          }
          return
        }
      })
    }
  }
  c_remove_capability(prod, cap){
    let state = this.state
    if (window.confirm("Do you want to delete?")){
      cap = parseInt(cap)
      state.data.combination.forEach(item => {
        if (item.id === prod){
          let found = item.capability.filter(e => e.cap != cap)
          if (found.length >= 0){
            item.capability = found       
          }
        }
      })
      this.setState(state, ()=>{
        this.save_data()
      })
    }
  }
  c_remove_combination(comb){
    if (window.confirm("Do you want to delete?")){
      let state = this.state
      let combinations = state.data.combination.filter(e => e.id !== comb.id)
      state.data.combination = combinations
      this.setState(state, ()=>{
        this.save_data()
      })
    }
  }
  c_get_color_code(prod_id){
    let all = this.state.data.products1.concat(this.state.data.products2)
    let color= '#000000'
    all.forEach(item => {
      if ( item.id === prod_id ){     
        color = item.color;
        return
      }
    })
    return color;
  }
  render() {
    let state = this.state
    return ( 
      <section className="capability">
        <div className="container">
          <header>
            <a className="planview-logo" href="/" rel="home" title="Planview">Planview</a>
            <span>Capability Map Management</span>
            <nav>
              <button className={state.slide === 0 ? 'active' : ''} onClick={()=> this.setState({slide: 0})}>Products Management</button>
              <button className={state.slide === 1 ? 'active' : ''} onClick={()=> this.setState({slide: 1})}>Capabilities Management</button>
              <button className={state.slide === 2 ? 'active' : ''} onClick={()=> this.setState({slide: 2})}>Map Management &amp; Miscellaneous</button>
            </nav>
            <button className='btn-publish' onClick={this.publish.bind(this)}>Publish</button>
          </header>
          <main>
            <section className="slides">
              <div className={`slide ${state['slide'] === 3 ? 'active' : ''}`}>
                {
                  state['slide'] === 3 &&
                  <div className='combine'>
                    <h4 className='l5-heading'>Combine Capabilities for {state.c_prod.title}</h4> 
                    <div className='selection-area'>
                      <button className={`${ state.c_prod.is_selected ? 'selected' : ''}`} onClick={this.c_selecting_main_prod.bind(this)}>{state.c_prod.title}</button>
                      <ul className='support'>
                        {
                          state.c_list.map((e, i) => (
                            <li key={i}>
                              <button className={`${ e.is_selected ? 'selected' : ''}`} style={{color: '#fff', backgroundColor: e.color}} onClick={() => this.c_selecting_prod(i)}>{e.title}</button>
                            </li>
                          ))
                        }
                      </ul>
                      <button className='btn-set' onClick={this.c_set_combination.bind(this)}>Set Combination</button>
                    </div>  
                    <div className='combine-list'>
                      <h3>List of all combination capabilites</h3>
                      {
                        state.data && state.data.combination && 
                        <ul className='main'>
                          {
                            state.data.combination.map((item, i) => (
                              <li key={i}>
                                <span onClick={()=> this.c_remove_combination(item)}>{item.prods.join(', ')}</span>
                                <ul className='list'>
                                {
                                  item.capability && item.capability.map((e, j) => {
                                    let cap = this.get_capability_name(e.cap)
                                    return (
                                      <li key={j}>
                                        <button className='btn-remove' style={{borderColor: this.c_get_color_code(e.prod_id)}} onClick={() =>this.c_remove_capability(item.id, cap['id'])}>
                                          {cap['header']}
                                          {
                                            e.star && <i className='icon-star-solid' style={{color: this.c_get_color_code(e.prod_id)}} ></i>
                                          }
                                        </button>
                                      </li>
                                    )
                                  })
                                }
                                <li><button className='btn-add' onClick={() => this.setState({c_prod_add: item.id, c_prod_list: item.prods})}><i className="icon icon-plus1"></i> Add</button></li>
                              </ul>
                              </li>
                            ))
                          }
                        </ul>
                      }
                    </div>
                    <div className={`popup ${state['c_prod_add'] ? 'show' : ''}`}>
                      <div className='body'>
                        <h3>Select Capability</h3>
                        <select onChange={(e) => this.handleChange(e, 'c_cap_add') }>
                          <option value=''>Select Capability</option>
                          {
                            state.data.portfolio && this.list_capabilities().map((item, i) => (
                              <option key={i} value={item.id}>{item.header}</option>
                            ))
                          }
                        </select>
                        <br />
                        <input id="chkHilight" type='checkbox' onChange={(e) => this.setState({c_cap_add_star: !this.state.c_cap_add_star})} checked={state.c_cap_add_star} />
                        <label htmlFor="chkHilight">Is corner highlight?</label>
                        <br />
                        <br />
                        <label>Which product is it belong to?</label>
                        <select onChange={(e) => this.handleChange(e, 'c_cap_hilight') }>
                          <option value={state.c_prod.id}>{state.c_prod.title}</option>
                          {
                            state.c_list && state.c_list.map((item, i) =>(
                              <option key={i} value={item.id}>{item.title}</option>
                            ))
                          }
                        </select>                         
                        <button onClick={this.c_add_capability.bind(this)}>Insert</button>
                        <button className='btn-close' onClick={()=> this.setState({c_prod_add: false})}><i className='icon-close-x'></i></button>
                      </div>
                    </div>
                  </div>
                }
              </div>
              <div className={`slide ${state['slide'] === 0 ? 'active' : ''}`}>
                <div className="products">
                  <h2>Portfolio Management</h2>
                  <ul>
                  {
                    state.data.products1 && state.data.products1.map((item, i) => (
                      <li key={i}>
                        <span className='title'>{item.title}</span>
                        <strong>Complementary</strong>
                        <ul className="list">
                          {
                            item.support && item.support.map((e, j) => {
                              let support = this.get_supporting(e)
                              if (support){
                                return (
                                  <li key={j}><button className='btn-remove' onClick={() => this.remove_support(item.id, e)}>{support.title}</button></li>
                                )
                              }
                            })
                          }
                          <li>
                            <button className='btn-add' onClick={() => this.setState({is_support: item.id})}><i className="icon icon-plus1"></i> Add</button>
                            {
                              item.support && item.support.length > 0 &&
                              <button className='btn-combine' onClick={() => this.open_support_combine(item.id)}><i className='icon-integrations-bright-red'></i> Combine</button>
                            }
                          </li>
                        </ul>
                        <br/>
                        <strong>Capabilities</strong>
                        <ul className='list'>
                          {
                            item.capability && item.capability.map((e, j) => {
                              let cap = this.get_capability_name(e)
                              return (
                                <li key={j}><button className='btn-remove' onClick={() =>this.remove_capability(item.id, cap['id'])}>{cap['header']}</button></li>
                              )
                            })
                          }
                          <li><button className='btn-add' onClick={() => this.setState({prod: item.id})}><i className="icon icon-plus1"></i> Add</button></li>
                        </ul>
                      </li>
                    ))
                  }
                  </ul>
                </div>
                <div className="products">
                  <h2>Supporting Products</h2>
                  <ul>
                  {
                    state.data.products2 && state.data.products2.map((item, i) => (
                      <li key={i}>
                        <span className='title'>{item.title}</span>
                        <strong>Capabilities</strong>
                        <ul className='list'>
                          {
                            item.capability && item.capability.map((e, j) => {
                              let cap = this.get_capability_name(e)
                              return (
                                <li key={j}><button className='btn-remove' onClick={() =>this.remove_capability(item.id, cap['id'])}>{cap['header'] }</button></li>
                              )
                            })
                          }
                          <li>
                            <button className='btn-add' onClick={() => this.setState({prod: item.id})}><i className="icon icon-plus1"></i> Add</button>                            
                          </li>
                        </ul>
                      </li>
                    ))
                  }
                  </ul>
                </div>
                <div className={`popup ${state['is_support'] ? 'show' : ''}`}>
                  <div className='body'>
                    <h3>Select Complementary a Product</h3>
                    <select onChange={(e) => this.handleChange(e, 'sup_add') }>
                      <option value=''>Select product</option>
                      {
                        state.data.products2 && state.data.products2.map((item, i) => (
                          <option key={i} value={item.id}>{item.title}</option>
                        ))
                      }
                    </select>
                    <button onClick={this.add_support.bind(this)}>Insert</button>
                    <button className='btn-close' onClick={()=> this.setState({is_support: false})}><i className='icon-close-x'></i></button>
                  </div>
                </div>
                <div className={`popup ${state['prod'] ? 'show' : ''}`}>
                  <div className='body'>
                    <h3>Select Capability</h3>
                    <select onChange={(e) => this.handleChange(e, 'cap_add') }>
                      <option value=''>Select Capability</option>
                      {
                        state.data.portfolio && this.list_capabilities().map((item, i) => (
                          <option key={i} value={item.id}>{item.header}</option>
                        ))
                      }
                    </select>
                    <button onClick={this.add_capability.bind(this)}>Insert</button>
                    <button className='btn-close' onClick={()=> this.setState({prod: false})}><i className='icon-close-x'></i></button>
                  </div>
                </div>
              </div>
              <div className={`slide ${state['slide'] === 1 ? 'active' : ''}`}>
                <h2>Capabilities Management</h2>
                <div className='caps'>
                  <h3>Portfolio Management</h3>
                  <ul className='main'>
                    {
                      state.data.portfolio && state.data.portfolio.map((item, i) => (
                        <li key={i}>
                          <span className='title'>{item.label}</span>
                          <ul className='list'>
                            {                              
                              item.rows.map((e, j) => {
                                if (e) {
                                  return (
                                    <li key={j} className={e.style || ''}><button onClick={() => this.cm_open_editor({main: 'portfolio', col: i, row: j})}>{e.header}</button></li>
                                  )
                                }else{
                                  return (
                                    <li key={j}><button onClick={() => this.cm_open_editor({main: 'portfolio', col: i, row: j})}>&nbsp;</button></li>
                                  )
                                }
                              })
                            }
                          </ul>
                          <button className='btn-add' onClick={() => this.cm_open_editor({main: 'portfolio', col: i, row: -1})}><i className='icon icon-plus1'></i></button>
                          <button className='btn-remove' onClick={() => this.cm_remove_row({main: 'portfolio', col: i})}><i className='icon icon-minus1'></i></button>
                        </li>
                      ))
                    }
                    <li><button className='btn-add-cap' onClick={()=> this.cm_add_capability('portfolio')}><i className='icon icon-plus1'></i> Add Row</button></li>
                  </ul>
                  <h3>Work Management</h3>
                  <ul className='main'>
                    {
                      state.data.work && state.data.work.map((item, i) => (
                        <li key={i}>
                          <span className='title'>{item.label}</span>
                          <ul className='list'>
                            {
                              item.rows.map((e, j) => {
                                if (e) {
                                  return (
                                    <li key={j} className={e.style || ''}><button onClick={() => this.cm_open_editor({main: 'work', col: i, row: j})}>{e.header}</button></li>
                                  )
                                }else{
                                  return (
                                    <li key={j}><button onClick={() => this.cm_open_editor({main: 'work', col: i, row: j})}>&nbsp;</button></li>
                                  )
                                }
                              })
                            }
                          </ul>
                          <button className='btn-add' onClick={() => this.cm_open_editor({main: 'work', col: i, row: -1})}><i className='icon icon-plus1'></i></button>
                          <button className='btn-remove' onClick={() => this.cm_remove_row({main: 'work', col: i})}><i className='icon icon-minus1'></i></button>
                        </li>
                      ))
                    }
                    <li><button className='btn-add-cap' onClick={()=> this.cm_add_capability('work')}><i className='icon icon-plus1'></i> Add Row</button></li>
                  </ul>
                  <h3>Extra Capabilities</h3>
                  <ul className='main extra'>
                    {
                      state.data.ctas && state.data.ctas.map((item, i) => (
                        <li key={i}>
                          <ul className='list'>
                            {
                              item.rows.map((e, j) => {
                                if (e) {
                                  return (
                                    <li key={j} className={e.style || ''}><button onClick={() => this.cm_open_editor({main: 'ctas', col: i, row: j})}>{e.header}</button></li>
                                  )
                                }else{
                                  return (
                                    <li key={j}><button onClick={() => this.cm_open_editor({main: 'ctas', col: i, row: j})}>&nbsp;</button></li>
                                  )
                                }
                              })
                            }
                          </ul>
                        </li>
                      ))
                    }
                    <li><button className='btn-add-cap' onClick={this.cm_add_capability_ctas.bind(this)}><i className='icon icon-plus1'></i> Add Row</button></li>
                  </ul>
                  <div className={`popup ${state.cap_pos ? 'show' : ''}`}>
                    <div className='body'>
                      <div className='field'>
                        <label>Main Title</label>
                        <input type="text" value={state.editor && state.cap_main_title ? state.cap_main_title : ''} onChange={(e) => this.cm_title_handle_change(e.target.value)}/>
                      </div>
                      <div className='field'>
                        <label>Title</label>
                        <input type="text" value={state.editor && state.editor.header ? state.editor.header : ''} onChange={(e) => this.cm_editor_handle_change(e.target.value, 'header')}/>
                      </div>
                      <div className='field'>
                        <label>Description</label>
                        <ReactQuill value={state.editor && state.editor.description ? state.editor.description : ''} onChange={(value) => this.cm_editor_handle_change(value, 'description')} />
                      </div>
                      <div className='field'>
                        <label>Column Style</label>
                        <select value={state.editor && state.editor.style ? state.editor.style : ''} onChange={(e) => this.cm_editor_handle_change(e.target.value, 'style')}>
                          <option>Full</option>
                          <option value='half'>Half</option>
                        </select>
                      </div>
                      <div className='field'>
                        <label>Arrange Order</label>
                        <input type="text" value={state.editor && state.editor.order ? state.editor.order : ''} onChange={(e) => this.cm_editor_handle_change(e.target.value, 'order')}/>
                      </div>
                      <div className='field'>
                        <label>Button Text</label>
                        <input type="text" value={state.editor && state.editor.button_text ? state.editor.button_text : 'Learn More'} onChange={(e) => this.cm_editor_handle_change(e.target.value, 'button_text')}/>
                      </div>
                      <div className='field'>
                        <label>Button URL</label>
                        <input type="text" value={state.editor && state.editor.learn ? state.editor.learn : ''} onChange={(e) => this.cm_editor_handle_change(e.target.value, 'learn')}/>
                      </div>
                      <button onClick={this.cm_save_capability.bind(this)}>Save</button>
                      <button className='remove' onClick={this.cm_remove_capability.bind(this)}>Delete</button>
                      <button className='btn-close' onClick={() => this.setState({cap_pos: null, editor: {}})}><i className='icon-close-x'></i></button>
                    </div>
                  </div>
                </div>
              </div>
              <div className={`slide ${state['slide'] === 2 ? 'active' : ''}`}>
                <h2>Map Management</h2>
                <ul className='map'>
                  {
                    state.data.map && state.data.map.map((item,i) => (
                      <li key={i}><button onClick={() => this.setState({m_show: true, map: state.data.map[i]})}>{item.label}</button></li>
                    ))
                  }
                </ul>
                <hr />
                <h2>Miscellaneous</h2>
                {
                  state.data.others &&
                  <>
                    <div className='m-products'>
                      <h3>Products Section</h3>
                      <div className='field'>
                        <label>Label</label>
                        <input type="text" value={state.data.others['prod-label']} onChange={(e)=>this.m_handle_change_other(e, 'prod-label')} />
                      </div>
                      <div className='field'>
                        <label>Title Left</label>
                        <input type="text" value={state.data.others['prod-title-1']} onChange={(e)=>this.m_handle_change_other(e, 'prod-title-1')} />
                      </div>
                      <div className='field'>
                        <label>Title Right</label>
                        <input type="text" value={state.data.others['prod-title-2']} onChange={(e)=>this.m_handle_change_other(e, 'prod-title-2')} />
                      </div>
                      <div className='field'>
                        <label>Complement Product Label</label>
                        <input type="text" value={state.data.others['prod-support']} onChange={(e)=>this.m_handle_change_other(e, 'prod-support')} />
                      </div>
                      <div className='field'>
                        <label>Complement Product Text</label>
                        <input type="text" value={state.data.others['prod-support-label']} onChange={(e)=>this.m_handle_change_other(e, 'prod-support-label')} />
                      </div>
                    </div>
                    <div className='m-products'>
                      <h3>Capability Section</h3>
                      <div className='field'>
                        <label>Title</label>
                        <input type="text" value={state.data.others['pm-title']} onChange={(e)=>this.m_handle_change_other(e, 'pm-title')} />
                      </div>
                      <div className='field'>
                        <label>Title</label>
                        <input type="text" value={state.data.others['w-title']} onChange={(e)=>this.m_handle_change_other(e, 'w-title')} />
                      </div>                  
                    </div>
                    <button className='save' onClick={this.m_save_map.bind(this)}>Save</button>
                  </>
                }
                <div className={`popup ${state['m_show'] ? 'show' : ''}`}>
                  <div className='body'>
                    <div className='field'>
                      <label>Title</label>
                      <input type="text" value={state.map && state.map['label'] ? state.map['label'] : ''} onChange={(e)=> this.m_handle_change(e, 'label')} />
                    </div>
                    <div className='field'>
                      <label>URL</label>
                      <input type="text" value={state.map && state.map['url'] ? state.map['url'] : ''} onChange={(e)=> this.m_handle_change(e, 'url')} />
                    </div>
                    <button className='save' onClick={this.m_save_map.bind(this)}>Save</button>
                    <button className='btn-close' onClick={() => this.setState({m_show: false})}><i className='icon-close-x'></i></button>
                  </div>
                </div>
              </div>
            </section>
            
          </main>
        </div>
        <footer>
          <p>Copyright &copy; 2020. Planview, Inc. All Rights Reserved.</p>
        </footer>
      </section>
    )
  }
}
export default Capability;