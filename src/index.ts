import * as azure from 'azure-storage'
import * as fs from 'fs'
import * as path from 'path'
import * as uuid from 'uuid'
import * as color from 'colors'
import config from './config'

const connectionStr = config.connectionStr

const defaultContainerName = 'car'

const blobSvc = azure.createBlobService(connectionStr)

const commandDel = process.env.npm_config_del

const commandDown = process.env.npm_config_down

const commandUpl = process.env.npm_config_upload

const help = process.argv.slice(2)[0];

const uploadFolder = 'upload'

const downloadFolder = 'out'

export default class CarSharing {
    constructor() { }

    /**
     * 上傳檔案。
     * @param containerName 
     * @param fileName 
     * @param uploadFilePath 
     */
    upLoadImage(containerName: string, fileName: string, uploadFilePath: string) {
        blobSvc.createAppendBlobFromLocalFile(containerName, fileName, uploadFilePath, (error, result, response) => {
            if (!error) {
                console.log('upload ok'.green)
            } else {
                console.log(error)
            }
        })
    }

    /**
     * 列出資料夾中的全部檔案
     * @param containerName 
     */
    listFolder(containerName: string): Promise<azure.BlobService.BlobResult[]> {
        return new Promise((resolve, reject) => {
            blobSvc.listBlobsSegmented(containerName, null, (error, result, response) => {
                if (!error) {
                    if(result.entries.length>1){
                        console.log('===========List All file=============')
                        result.entries.forEach((element: any) => {
                            console.log(color.green(element.name))
                        });
                        console.log('=====================================')
                    }else{
                        console.log('Container No files'.cyan);
                    }
                   
                }

                return resolve(result.entries)
            })
        })


    }

    /**
     * 下載全部檔案。
     * @param containerName 
     * @param filename 
     * @param filePath 
     */
    downloadFile(containerName: string, filename: string, filePath: string) {
        blobSvc.getBlobToStream(containerName, filename, fs.createWriteStream(filePath), (error, result, response) => {
            if (!error) {
                console.log('download OK'.green)
            } else {
                console.error(error)
            }
        });
    }

    /**
     * 刪除檔案
     * @param containerName 
     * @param filename 
     */
    deleteFile(containerName: string, filename: string) {
        blobSvc.deleteBlobIfExists(containerName, filename, (error, result, response) => {
            if (!error) {
                console.log('delete OK'.green)
            } else {
                console.error(error)
            }
        })
    }
}

const carshare = new CarSharing()

let returnEntities = null

if (help) {
  console.log(`
============================================================
        azure storage command list
============================================================

example:npm start --del

del   del all car share folder files
upload upload all file in upload folder
down  download all files in car share folder

`)
}else{
    returnEntities = carshare.listFolder(defaultContainerName)
}


if (commandUpl) {
    fs.readdirSync(uploadFolder).forEach(file => {
     carshare.upLoadImage(defaultContainerName, uuid.v4() + '.jpg', path.join(uploadFolder,file))
    })
   
}

if (commandDown) {
    returnEntities.then((result) => {
        result.forEach((item: any) => {
            carshare.downloadFile(defaultContainerName, item.name, path.resolve('out', item.name))
        })
    })
}

if (commandDel) {
    returnEntities.then((result) => {
        result.forEach((item: any) => {
            carshare.deleteFile(defaultContainerName, item.name)
        })
    })
}













