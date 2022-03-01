import './App.css';
import React from 'react';
import CreateTaskContent from './CreateTaskContent'
import CreateTaskHeader from './CreateTaskHeader';
import TaskCountdown from './TaskCountdown';
import Container from "react-bootstrap/Container"


function App (props) {
  
  return (
    <div className="bg-dark">
      <Container className="App p-3 bg-dark" >
        <Container>
          < CreateTaskHeader />
        </Container>
        < CreateTaskContent />
        < TaskCountdown />
      </Container>
    </div>
  );
}

export default App;