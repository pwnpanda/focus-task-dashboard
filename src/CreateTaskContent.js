import React from "react";
import Row from "react-bootstrap/Row"
import Col from "react-bootstrap/Col"
import Button from "react-bootstrap/Button"
import DatePicker, { registerLocale, setDefaultLocale } from  "react-datepicker";
import nb from 'date-fns/locale/nb';
import { useSelector } from 'react-redux'

registerLocale('nb', nb)
setDefaultLocale('nb', nb)

const CreateTaskContent = () => {    
    const calendar = useSelector(state => state.goalPlan);
    
    // TODO need to call to update end-date everytime it is changed
    // TODO change all setX functions to redux
    // TODO change variable names

    const onClick = () => {
        if (taskName==="")  setTaskNameError("Cannot use an empty taskname!");
        else {
            setShowCalendar(true);
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
                    <DatePicker selected={calendar.endDate} onChange={(date) => setEndDate(date)} />
                </Col>
                <Col>
                    <p>Task</p>
                    <input type="text" placeholder="ExampleTask" value={calendar.taskName} onChange={onChange}></input>
                </Col>
                <Col>
                    <p style={{ visibility: "hidden" }}>Save</p>
                    <Button className="align-items-bottom align-bottom btn btn-success" onClick={onClick}>Save</Button>
                </Col>
                {calendar.taskNameError && <p style={{ color: "red" }}>{calendar.taskNameError}</p>}
            </Row>
        </div>
    )
}

export default CreateTaskContent