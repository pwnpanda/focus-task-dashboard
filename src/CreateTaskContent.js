import React from "react";
import Row from "react-bootstrap/Row"
import Col from "react-bootstrap/Col"
import Button from "react-bootstrap/Button"
import DatePicker, { registerLocale, setDefaultLocale } from  "react-datepicker";
import nb from 'date-fns/locale/nb';
import { useTaskContext } from "./TaskContext";

registerLocale('nb', nb)
setDefaultLocale('nb', nb)

const CreateTaskContent = () => {    
    const { startDate, setTaskName, taskName, setEndDate, endDate, setShowCalendar, showCalendar, taskNameError, setTaskNameError, hidden, setCalDates, saveStorage } = useTaskContext();
    
    const onClick = () => {
        if (taskName==="")  setTaskNameError("Cannot use an empty taskname!");
        else {
            setTaskNameError("");
            setShowCalendar(true);
            setCalDates([startDate, endDate], saveStorage);
        }
    }

    const onChange = e => {
        setTaskName(e.target.value, saveStorage)
    }

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