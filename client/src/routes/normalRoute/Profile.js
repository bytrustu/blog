import React, {useState} from 'react';
import {useDispatch, useSelector} from "react-redux";
import {useParams} from 'react-router-dom';
import {CLEAR_ERROR_REQUEST, PASSWORD_EDIT_UPLOADING_REQUEST} from "../../redux/types";
import {Col, Card, Alert, Button, Form, FormGroup, Label, Input} from "reactstrap";
import CardHeader from "reactstrap/es/CardHeader";
import CardBody from "reactstrap/es/CardBody";
import {Helmet} from "react-helmet";

const Profile = () => {
    const {userId, errorMsg, successMsg, previousMatchMsg} = useSelector((state) => state.auth);
    const {userName} = useParams();
    const [form, setForm] = useState({
        previousPassword: '',
        password: '',
        rePassword: '',
    })
    const dispatch = useDispatch();
    const onChange = (e) => {
        setForm({
            ...form,
            [e.target.name]: e.target.value
        })
    }

    const onSubmit = async (e) => {
        await e.preventDefault();
        const {previousPassword, password, rePassword} = form;
        const token = localStorage.getItem('token');
        const body = {
            token, previousPassword, password, rePassword, userId, userName
        }
        dispatch({
            type: CLEAR_ERROR_REQUEST
        })
        dispatch({
            type: PASSWORD_EDIT_UPLOADING_REQUEST,
            payload: body
        })
    }

    return (
        <>
            <Helmet title={`Profile | ${userName}님의 프로필`}/>
            <Col sm="12" md={{size: 6, offset: 3}}>
                <Card>
                    <CardHeader>
                        <strong>Edit Password</strong>
                    </CardHeader>
                    <CardBody>
                        <Form onSubmit={onSubmit}>
                            <FormGroup>
                                <Label for="title">기존 비밀번호</Label>
                                <Input type="password" name="previousPassword" id="previousPassword" className="form-control mb-2" onChange={onChange}/>
                                {
                                    previousMatchMsg && <Alert color="danger">{previousMatchMsg}</Alert>
                                }
                            </FormGroup>
                            <FormGroup>
                                <Label for="title">새로 비밀번호</Label>
                                <Input type="password" name="password" id="password" className="form-control mb-2" onChange={onChange}/>
                            </FormGroup>

                            <FormGroup>
                                <Label for="title">비밀번호 확인</Label>
                                <Input type="password" name="rePassword" id="rePassword" className="form-control mb-2" onChange={onChange}/>
                                {
                                    errorMsg && <Alert color="danger">{errorMsg}</Alert>
                                }
                            </FormGroup>
                            <Button color="success" block className="mt-4 mb-4 col-md-3 offset-9">제출하기</Button>
                            {
                                successMsg && <Alert color="success">{successMsg}</Alert>
                            }
                        </Form>
                    </CardBody>
                </Card>
            </Col>
        </>
    )
}

export default Profile;