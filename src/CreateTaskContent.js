import React, { useContext } from "react";
import Row from "react-bootstrap/Row"
import Col from "react-bootstrap/Col"
import Button from "react-bootstrap/Button"
import DatePicker, { registerLocale, setDefaultLocale } from  "react-datepicker";
import nb from 'date-fns/locale/nb';
import { useTaskContext } from "./TaskContext";

registerLocale('nb', nb)
setDefaultLocale('nb', nb)

const CreateTaskContent = () => {    
    const { setTaskName, taskName, setEndDate, endDate, setShowCalendar, showCalendar, taskNameError, setTaskNameError, hidden } = useTaskContext();
    
    const onClick = () => {
        if (taskName==="")  setTaskNameError("Cannot use an empty taskname!");
        else {
            console.log(taskName, endDate);
            setTaskNameError("");
            setShowCalendar(true);
        }
    }

    const onChange = e => {
        setTaskName(e.target.value)
    }
    console.log("Show calendar " + showCalendar);
    return (
        <div style={showCalendar===true ? hidden: null}>
            <Row className="align-items-center">
                <h3>Create a task</h3>
            </Row>
            <Row className="align-items-center">
                <Col>
                    <p>Pick end-date</p>
                    <DatePicker selected={endDate} onChange={(date) => setEndDate(date)} />
                </Col>
                <Col>
                    <p>Task</p>
                    <input type="text" placeholder="ExampleTask" value={taskName} onChange={onChange}></input>
                </Col>
                <Col>
                    <p style={{ visibility: "hidden" }}>Save</p>
                    <Button className="align-items-bottom align-bottom btn btn-success" onClick={onClick}>Save</Button>
                </Col>
                {taskNameError && <p style={{ color: "red" }}>{taskNameError}</p>}
            </Row>
        </div>
    )
}

export default CreateTaskContent