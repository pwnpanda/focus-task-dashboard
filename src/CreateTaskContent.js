import React from "react";
import Row from "react-bootstrap/Row"
import Col from "react-bootstrap/Col"
import Button from "react-bootstrap/Button"
import DatePicker, { registerLocale, setDefaultLocale } from  "react-datepicker";
import nb from 'date-fns/locale/nb';
import { useDispatch, useSelector } from 'react-redux'
import { setShowCalendar, setError, setEndDate, setName } from "./redux-store";

registerLocale('nb', nb)
setDefaultLocale('nb', nb)

const CreateTaskContent = () => {    
    const calendar = useSelector(state => state.goalPlans);
    const dispatch = useDispatch();

    const hidden = { display: "none" }

    const onClick = () => {
        if (calendar.taskName==="")  dispatch( setError("Cannot use an empty taskname!") );
        else {
            dispatch( setShowCalendar(true) );
        }
    }

    return (
        <div style={calendar.showCalendar===true ? hidden: null}>
            <Row className="align-items-center">
                <h3>Create a task</h3>
            </Row>
            <Row className="align-items-center">
                <Col>
                    <p>Pick end-date</p>
                    <DatePicker selected={calendar.endDate} onChange={(date) => dispatch( setEndDate(date) )} />
                </Col>
                <Col>
                    <p>Task</p>
                    <input type="text" placeholder="ExampleTask" value={calendar.taskName} onChange={ e => 
                        dispatch( setName(e.target.value))
                    }></input>
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