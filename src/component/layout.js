import React, { Component } from 'react';
import '../App.css';
import { Image, Table, Button, Input, Form } from 'semantic-ui-react';
import MoiBit from '../moibit_logo_transparent.png';
import TableList from './tableList';
import credentials from '../middleware/credentials';
import Instance from '../middleware/web3';
import axios from 'axios';
import ShowModal from './modal';
import Utils from '../middleware/signatureParamsUtil';
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
    }
    async componentDidMount() {

        let acc = await Instance.web3.eth.getAccounts();
        this.setState({ accountId: acc[0] });
        this.observe();
        axios.defaults.headers.common['api_key'] = credentials.API_KEY;
        axios.defaults.headers.common['api_secret'] = credentials.API_SECRET;

        if (acc[0] === credentials.ADMIN) {
            this.getALLHashes();
        }
        else {
            this.getFileHash();
        }
    }

    getFileHash = async () => {
        let data = await Instance.Config.methods.getList().call({ from: this.state.accountId });
        let actual = [];
        if(data.length !== 0) {
            for (let i = 0; i < data.length; i++) {
                actual.push({
                        Name :  data[i].fileName.split("/")[1],
                        Hash :  data[i].fileHash,
                        verfiledBoolean : 0
                    });
            }
        }
        this.setState({ fileList: actual });
    }

    getALLHashes = async () => {
        let response = await axios({
            method: 'post',
            url: credentials.CUSTOM_URL+"/moibit/listfiles",
            data: { path: "/" }
        });
        let data = [];
        if(response.data.data.Entries !== null) {
            for (let i = 0; i < response.data.data.Entries.length; i++) {
                if (response.data.data.Entries[i].Type === 0) {
                    await data.push({
                        Name :  response.data.data.Entries[i].Name,
                        Hash :  response.data.data.Entries[i].Hash,
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
            let formData = new FormData();
            formData.append('file', this.state.file);
            formData.append('fileName', '/' + this.state.file.name);
            this.setState({ loading: true });

            let response = await axios({
                method: 'post',
                url: credentials.CUSTOM_URL+"/moibit/writefile",
                data: formData
            });
            const actualFileName = credentials.API_KEY + "" + response.data.data.Path + "" + response.data.data.Name;
            Utils.getSignature(response.data.data.Hash,this.state.accountId,async (sig) => {
                console.log(sig)
                await Instance.Config.methods.setHash(actualFileName,sig).send({ from: this.state.accountId });
                if (this.state.accountId === credentials.ADMIN) {
                    this.getALLHashes();
                    this.setState({ loading: false });
                }
                else {
                    this.getFileHash();
                    this.setState({ loading: false });
                }
                this.setState({ loading: false });
            });
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

    checkForProvenence = async (name,hash) => {
        let response = await axios({
            method: 'post',
            url: credentials.CUSTOM_URL+"/moibit/listfiles",
            data: { path: "/" }
        });

        let allFiles = response.data.data.Entries;
        const index1 = allFiles.map(e => e.Name).indexOf(name);
        let checkingHash = '';
        if(index1 != -1) {
            checkingHash = allFiles[index1].Hash;
        }
        

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

            /* we are rendering all the root files so we are adding / in prefix to file name */
            const filename = credentials.API_KEY+'/'+name; 
            if(checkingHash == await Instance.Config.methods.getHashByName(filename).call()) {
                files[index] = {
                    Name :  name,
                    Hash :  hash,
                    verfiledBoolean : 1
                }
                this.setState({fileList : files});
            }
            else {
                files[index] = {
                    Name :  name,
                    Hash :  hash,
                    verfiledBoolean : -1
                }
                this.setState({fileList : files});
                successs = false;
            }
            return successs;
        }
        else {
            return successs;
        }
    }

    readFile = async (filehash, fileName,validBoolean) => {
        if(validBoolean) {
            var responseType = '';
            if (fileName.substr(-3, 3) === "txt" || fileName.substr(-3, 3) === "csv" || fileName.substr(-3, 3) === "php" || fileName.substr(-3, 3) === "html" || fileName.substr(-2, 2) === "js") {
                responseType = '';
            }
            else {
                responseType = 'blob';
            }
            const url = credentials.CUSTOM_URL+'/moibit/readfilebyhash';
            axios({
                method: 'post',
                url: url,
                responseType: responseType,
                data: {
                    hash: filehash
                }
            })
            .then(response => {
                if (typeof (response.data) == "string") {
                    this.setState({ readFileIframe: response.data,
                        fileType: response.headers['content-type'],
                        fileName: fileName,
                        modalOpen: true
                    });
                }
                else {
                    this.setState({
                        readFileIframe: window.URL.createObjectURL(new Blob([response.data], {type:response.headers['content-type']})),
                        fileType: response.headers['content-type'],
                        fileName: fileName,
                        modalOpen: true 
                    })
                }
            })
            .catch(error => {
                console.log(error);
            });
        }
        else {
            this.setState({ readFileIframe: "You are not authorized to see this file",
                            fileType: 'text/plain',
                            fileName: 'Alert!',
                            modalOpen: true
                        });
        }
    }

    verifyAndRead = async (signedFileHash, fileName,fileHash) => {
        Utils.verifyReceipent(signedFileHash,fileHash,this.state.accountId,(bool) => {
            this.readFile(fileHash,fileName,bool)
        })
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
                                                API_KEY : {credentials.API_KEY}
                                            </Table.Cell>
                                        </Table.Row>
                                        <Table.Row>
                                            <Table.Cell colSpan='2'>
                                                <div style={{ wordWrap: 'break-word', width: '600px' }}>
                                                    API_SECRET : {credentials.API_SECRET}
                                                </div>
                                            </Table.Cell>
                                        </Table.Row>
                                    </Table.HeaderCell>
                                </Table.Row>
                            </Table.Header>
                        </Table>
                    </Form>
                    <div className="content-container">
                        <TableList fileList={this.state.fileList} readFile={this.verifyAndRead}
                        />

                    </div>
                </div>
            </div>
        );
    }
}
export default Layout;