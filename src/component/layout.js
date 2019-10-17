import React, { Component } from 'react';
import '../App.css';
import { Image, Table, Button, Input, Form } from 'semantic-ui-react';
import MoiBit from '../moibit_logo_transparent.png';
import TableList from './tableList';
import credentials from '../middleware/credentials';
import Instance from '../middleware/web3';
import ShowModal from './modal';
import Matic from 'maticjs';
class Layout extends Component {
    state = {
        fileList: [],
        file: '',
        accountId: '',
        loading: false,
        fieldReq: false,
        readFileIframe: '',
        fileType: '',
        modalOpen: false,
        fileName: '',
        matic : {},
        API_KEY : '',
        API_SECRET : ''
    }
    async componentDidMount() {
        try {
            let acc = await Instance.web3.eth.getAccounts();
            this.setState({ accountId: acc[0] });
            this.observe();
        
            let _matic = new Matic({ 
                maticProvider : window.web3.currentProvider 
            });
            await _matic.files.init(credentials.CUSTOM_URL,{
                API_KEY : credentials.API_KEY,
                API_SECRET : credentials.API_SECRET
            });
            this.setState({
                matic : _matic,
                API_KEY : credentials.API_KEY,
                API_SECRET : credentials.API_SECRET
            });
            this.getALLHashes();
        }catch(e) {
            console.log(e);       
        }
    }

    // getFileHash = async () => {
    //     let data = await Instance.Config.methods.getList().call({ from: this.state.accountId });
    //     let actual = [];
    //     if(data.length !== 0) {
    //         for (let i = 0; i < data.length; i++) {
    //             actual.push({
    //                     Name :  data[i].fileName.split("/")[1],
    //                     Hash :  data[i].fileHash,
    //                     verfiledBoolean : 0
    //                 });
    //         }
    //     }
    //     this.setState({ fileList: actual });
    // }

    getALLHashes = async () => {
        let response = await this.state.matic.files.list();
        console.log(response);
        let data = [];
        if(response !== null) {
            for (let i = 0; i < response.length; i++) {
                if (response[i].Type === 0) {
                    await data.push({
                        Name :  response[i].Name,
                        Hash :  response[i].Hash,
                        verfiledBoolean : 0
                    });
                }
            }
        }
        this.setState({ fileList: data });
    }
    handleSubmit = async (e) => {
        e.preventDefault();
        if (this.state.file !== "") {
            this.setState({ loading: true });
            await this.state.matic.files.add(this.state.file,this.state.file.name);
            this.setState({ loading: false });
            this.getALLHashes();
        }
        else {
            this.setState({ fieldReq: true })
        }
    }

    observe = async () => {
        try {
            setTimeout(this.observe, 1000);
            const accounts = await Instance.web3.eth.getAccounts();
            if (accounts[0] === this.state.accountId) {

            }
            else {
                window.location = "/";
            }
            return;
        }
        catch (error) {
            console.log(error.message);
        }
    }

    readFile = async (hash,name) => {
        let successs = true;
        let files = this.state.fileList;
        const index = files.map(e => e.Name).indexOf(name);
        if(files[index].verfiledBoolean === 0) {
            files[index] = {
                Name :  name,
                Hash :  hash,
                verfiledBoolean : 2
            }
            this.setState({fileList : files});
            var responseType = 'blob';
            this.state.matic.files.read(name,responseType)
            .then(response => {
                    if(response !== 'File modified off-chain') {
                             files[index] = {
                            Name :  name,
                            Hash :  hash,
                            verfiledBoolean : 1
                        }
                        this.setState({
                            fileList : files,
                            readFileIframe: window.URL.createObjectURL(new Blob([response.data], {type:response.contentType})),
                            fileType: response.contentType,
                            fileName: name,
                            modalOpen: true 
                        })
                    }
                    else {
                        files[index] = {
                                    Name :  name,
                                    Hash :  hash,
                                    verfiledBoolean : -1
                        }
                        this.setState({
                            fileList : files,
                            readFileIframe: "App cannot verify the file as the current hash is not recorded on matic network",
                            fileType: 'text/alert',
                            fileName: 'Unable to render file',
                            modalOpen: true
                        });
                    }
            })
            .catch(error => {
                console.log(error);
            });
        }
        else {
            return successs;
        }
    }

    modalClose = () => {
        this.setState({ modalOpen: false });
    }
    render() {
        const custom_header = {
            backgroundColor: '#222222',
            color: '#fbfbfb',
            border: '1px solid #fbfbfb'
        }
        return (
            <div className="layoutBG">
                {this.state.fileName !== '' ? <ShowModal modalOpen={this.state.modalOpen}
                    modalClose={this.modalClose}
                    fileType={this.state.fileType}
                    responseData={this.state.readFileIframe}
                    fileName={this.state.fileName}
                /> : null}
                <div style={{ display: 'flex', color: '#fbfbfb', marginLeft: '42vw' }}>
                    <Image src={MoiBit} height="60px" width="160px" />
                    {/* <h3 style={{ marginTop: '10px', fontSize: '26px' }}>MoiBit</h3> */}
                </div>
                <div className="table_body_scrollable">
                    <Form onSubmit={(event) => this.handleSubmit(event)} encType="multipart/form-data">
                        <Table celled size="small" style={{ marginTop: '20px', marginBottom: '40px', background: '#f2f2f2', color: '#222222' }}>
                            <Table.Header>
                                <Table.Row>

                                    <Table.HeaderCell style={custom_header}>
                                        <Table.Row>
                                            <Table.Cell textAlign="center" colSpan='2'>
                                                <Input type="file" onChange={(e) => {
                                                    this.setState({ file: e.target.files[0] });
                                                }} required name="file" style={this.state.fieldReq ? { border: '2px solid red', borderRadius: '5px' } : {}} />
                                            </Table.Cell>
                                        </Table.Row>
                                        <Table.Row>
                                            <Table.Cell colSpan='2' textAlign="center" >
                                                <Button primary type="submit" loading={this.state.loading} disabled={this.state.loading} >Submit</Button>
                                            </Table.Cell>
                                        </Table.Row>
                                    </Table.HeaderCell>

                                    <Table.HeaderCell style={custom_header}>
                                        <Table.Row>
                                            <Table.Cell colSpan='2'>
                                                API_KEY : {this.state.API_KEY}
                                            </Table.Cell>
                                        </Table.Row>
                                        <Table.Row>
                                            <Table.Cell colSpan='2'>
                                                <div style={{ wordWrap: 'break-word', width: '600px' }}>
                                                    API_SECRET : {this.state.API_SECRET}
                                                </div>
                                            </Table.Cell>
                                        </Table.Row>
                                    </Table.HeaderCell>
                                </Table.Row>
                            </Table.Header>
                        </Table>
                    </Form>
                    <div className="content-container">
                        <TableList fileList={this.state.fileList} readFile={this.readFile}
                        />

                    </div>
                </div>
            </div>
        );
    }
}
export default Layout;