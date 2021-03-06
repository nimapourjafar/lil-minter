import React, { useEffect, useState } from 'react'
import { ethers } from 'ethers'
import {
  useAccount,
  useChainId,
  useStatus,
} from '@cfxjs/use-wallet/dist/ethereum'
import {
  abi,
  bytecode,
} from '../../artifacts/contracts/MinterNFT.sol/MinterNFT.json'
import { validAddress } from '../../util/validAddress'
import { useAlert } from 'react-alert'
import { getFlattenedContract } from '../../util/getFlattenedContarct'
import { ParamType } from 'ethers/lib/utils'
import { set, get } from 'idb-keyval'
import { Contract } from '../../types/Contract'

export default function DeployContract({
  setContractAddress,
  contractAddress,
  setState,
  storedContracts
}: {
  setContractAddress: (contractAddress: string) => void
  contractAddress: string | null
  setState: (state: 'configure') => void,
  storedContracts: Contract[]
}) {
  const alert = useAlert()
  const chainId = useChainId()
  const account = useAccount()
  const walletStatus = useStatus()
  const [setting, setSetting] = useState<'deploy' | 'import' | ''>('')
  const [address, setAddress] = useState('')
  const [name, setName] = useState('')
  const [tokenSymbol, setTokenSymbol] = useState('')
  const [deploying, setDeploying] = useState(false)

  const deployContract = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault()
    setDeploying(true)
    if (name == '' || tokenSymbol == '') {
      alert.error('Please enter a name and token symbol')
      setDeploying(false)
      return
    }
    if (walletStatus == 'not-active') {
      alert.error('Please connect wallet')
      setDeploying(false)
      return
    }

    if (!(chainId == '1030' || chainId == '71')) {
      alert.error('Please switch to eSpace')
      setDeploying(false)
      return
    }

    console.log('deploying contract')
    alert.info('Deploying contract...', {
      timeout: 10000,
    })
    const { ethereum } = window as any
    const provider = new ethers.providers.Web3Provider(ethereum)
    const signer = provider.getSigner()
    const NFTContract = new ethers.ContractFactory(abi, bytecode, signer)

    try {
      const deployContract = await NFTContract.deploy(name, tokenSymbol)
      setContractAddress(deployContract.address)
      set('contractAddress', deployContract.address)
      get('storedContracts').then((storedContracts) => {
        if (storedContracts) {
          set('storedContracts', [
            ...storedContracts,
            {
              address: deployContract.address,
              name: name,
              tokenSymbol: tokenSymbol,
            },
          ])
        } else {
          set('storedContracts', [
            {
              address: deployContract.address,
              name: name,
              tokenSymbol: tokenSymbol,
            },
          ])
        }
      })
      console.log('deployed at ', deployContract.address)
      alert.success("Contract deployed!")
      setState('configure')
    } catch (e) {
      console.log(e)
      alert.error('An error occurred when deploying contract')
    }
    setDeploying(false)
  }

  const checkIfContractImportable = async (
    e: React.MouseEvent<HTMLButtonElement, MouseEvent>
  ) => {
    e.preventDefault()
    if (walletStatus == 'active') {
      const { ethereum } = window as any
      const provider = new ethers.providers.Web3Provider(ethereum)
      const signer = provider.getSigner()

      const contract = new ethers.Contract(address.trim(), abi, signer)
      const isMinter = await contract.hasRole(
        ethers.utils.keccak256(ethers.utils.toUtf8Bytes('MINTER_ROLE')),
        account
      )
      if (isMinter) {
        setState('configure')
        setContractAddress(address)
        set('contractAddress', address)
      } else {
        alert.error('You do not have the MINTER_ROLE')
        return
      }
    } else {
      setState('configure')
      setContractAddress(address)
      set('contractAddress', address)
    }
  }

  const renderSetting = () => {
    if (setting == 'deploy') {
      return (
        <>
          <label>Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="text-input"
          />
          <label>Token Symbol</label>
          <input
            type="text"
            value={tokenSymbol}
            onChange={(e) => setTokenSymbol(e.target.value)}
            className="text-input"
          />
          <div className="flex flex-row justify-center space-x-3">
            <button
              className="btn-primary"
              onClick={deployContract}
              disabled={deploying}
            >
              Deploy 
            </button>
            <button
              className="btn-primary bg-red-500 hover:bg-red-600"
              onClick={() => {
                setSetting('')
              }}
            >
              Back
            </button>
          </div>
        </>
      )
    } else if (setting == 'import') {
      return (
        <>
        <label>
          Enter contract address
        </label>
          <input
            type="text"
            defaultValue={contractAddress ?? ''}
            placeholder="Contract Address"
            value={address}
            onChange={(e) => {
              setAddress(e.target.value)
              setContractAddress(e.target.value)
            }}
            className="text-input"
          />
          {
            storedContracts.length > 0 && (
              <>
              <label>Select previously deployed contract </label>
              <select defaultValue={""} onChange={(e)=>{
                setAddress(e.target.value)
                setContractAddress(e.target.value)
                console.log(e.target.value)
              }}
              className="p-2 border rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-75"
              >
                <option hidden={true}>Select a Contract </option>
                {storedContracts.map((contract) => (
                  <option key={contract.address} value={contract.address}>{contract.name} | {contract.tokenSymbol} | {contract.address} </option>
                ))}
              </select>
              </>
            )
          }
          <div className="flex flex-row justify-center space-x-3">
            <button
              className="btn-primary"
              onClick={checkIfContractImportable}
              disabled={!validAddress(address)}
            >
              Enter
            </button>
            <button
              className="btn-primary bg-red-500 hover:bg-red-600"
              onClick={() => {
                setSetting('')
              }}
            >
              Back
            </button>
          </div>
        </>
      )
    } else {
      return (
        <div className="flex flex-row justify-center space-x-4">
          <button
            className="btn-primary"
            onClick={() => {
              setSetting('deploy')
            }}
          >
            Deploy A New Contract
          </button>
          <button
            className="btn-primary"
            onClick={() => {
              setSetting('import')
            }}
          >
            Import an Existing Contract
          </button>
        </div>
      )
    }
  }

  return <div className="flex flex-col space-y-2">{renderSetting()}</div>
}
