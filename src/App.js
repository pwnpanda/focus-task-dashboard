import './App.css';
import React, {useState} from 'react';
import CreateTaskContent from './CreateTaskContent'
import CreateTaskHeader from './CreateTaskHeader';
import TaskCountdown from './TaskCountdown';
import Container from "react-bootstrap/Container"
import { TaskProvider } from './TaskContext';


function App (props) {
  return (
    <div className="bg-dark">
      <Container className="App p-3 bg-dark" >
      <TaskProvider>
        <Container>
          < CreateTaskHeader />
        </Container>
        < CreateTaskContent />
        < TaskCountdown />
        </TaskProvider>
      </Container>
    </div>
  );
}

export default App;
