import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import 'bootstrap/dist/css/bootstrap.min.css';
import "react-datepicker/dist/react-datepicker.css";
import '@natscale/react-calendar/dist/main.css';
import { Provider } from 'react-redux';
import { createStore } from 'redux'
import calendar, { saveState } from './redux-store'

const store = createStore(calendar);
store.subscribe( () => {
  saveState(store.getState());
})

ReactDOM.render(
  <React.StrictMode>
    <Provider store={store}>
      <App className="bg-dark" />
    </Provider>
  </React.StrictMode>,
  document.getElementById('root')
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
