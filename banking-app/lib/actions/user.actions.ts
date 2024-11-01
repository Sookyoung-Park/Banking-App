'use server';

import {createSessionClient, createAdminClient} from "../appwrite";
import { ID } from 'node-appwrite'
import { cookies } from "next/headers";
import { encryptId, extractCustomerIdFromUrl, parseStringify } from "../utils";
import { plaidClient } from "../plaid";
import { CountryCode, Products, ProcessorTokenCreateRequest, ProcessorTokenCreateRequestProcessorEnum } from "plaid";
import { revalidatePath } from "next/cache";
import { addFundingSource, createDwollaCustomer } from "./dwolla.actions";
import { Query } from "node-appwrite";

const{
    APPWRITE_DATABASE_ID: DATABASE_ID,
    APPWRITE_USER_COLLECTION_ID: USER_COLLECTION_ID,
    APPWRITE_BANK_COLLECTION_ID: BANK_COLLECTION_ID,
} = process.env

export const getUserInfo = async({userId}:getUserInfoProps) => {
    try{
        const {database} = await createAdminClient()
        const user = await database.listDocuments(
            DATABASE_ID!,
            USER_COLLECTION_ID!,
            [Query.equal(`userId`, [userId])]
        )
        return parseStringify(user.documents[0])
    }
    catch(error){
        console.log('error in getUserInfo', error)
    }
}

export const signIn = async(userData:signInProps) => {
    const { email, password } = userData 
    try{
        const { account } = await createAdminClient();

        const session = await account.createEmailPasswordSession(email, password); 

        cookies().set("appwrite-session", session.secret, {
            path: "/",
            httpOnly: true,
            sameSite: "strict",
            secure: true,
        });

        const user = await getUserInfo({userId: session.userId})
        return parseStringify(user);
    }
    catch(error){
        console.log('Error in SignIn user.actions : ',error)
    }
}

export const signUp = async ({ password, ...userData}:SignUpParams ) => {
    const {email, firstName, lastName} = userData
    let newUserAccount

    try{
        // Create a user account using appwrite - create from appwrite signup with email doc
        const { account, database } = await createAdminClient();

        newUserAccount = await account.create(
            ID.unique(), 
            email, 
            password, 
            `${firstName} ${lastName}`
        );

        if(!newUserAccount){
            throw new Error('Error in creating user')
        }
        
        // create dwolla customer(payment processor) url 
        const dwollaCustomerUrl = await createDwollaCustomer({
            ...userData,
            type: 'personal'
        })

        if(!dwollaCustomerUrl){
            throw new Error('Error in creating dwolla url in sign up')
        }
        const dwollaCustomerId = extractCustomerIdFromUrl(dwollaCustomerUrl)

        const newUser = await database.createDocument(
            DATABASE_ID!,
            USER_COLLECTION_ID!,
            ID.unique(),
            {
                ...userData,
                userId: newUserAccount.$id,
                dwollaCustomerId,  // corrected
                dwollaCustomerUrl  // corrected
            }
        )
        

        const session = await account.createEmailPasswordSession(email, password); 

        cookies().set("appwrite-session", session.secret, {
            path: "/",
            httpOnly: true,
            sameSite: "strict",
            secure: true,
        });
        return parseStringify(newUser)
    }
    catch(error){
        console.log('Error in SignUp user.actions : ',error)
    }
}

export const getLoggedInUser = async () => {
    try {
        const { account } = await createSessionClient();
        const result = await account.get();

        const user = await getUserInfo({userId: result.$id})
        return parseStringify(user)
        
    } catch (error) {
        console.log('Error in getLoggedInUser')
        return null;
    }
}

export const logoutAccount = async() => {
    try{
        const { account } = await createSessionClient();
        cookies().delete('app-write session')

        await account.deleteSession('current')
        return true
    }
    catch(error){
        console.log('Error in LogoutAccount',error)
        return false
    }
}

export const createLinkToken = async(user: User) => {
    try{
        const tokenParams = {
            user:{
                client_user_id: user.$id
            },
            client_name: `${user.firstName} ${user.lastName}`,
            products: ['auth'] as Products[],
            language: 'en',
            country_codes: ['US'] as CountryCode[],
            client_id: process.env.PLAID_CLIENT_ID,
            secret: process.env.PLAID_SECRET,
            // 'PLAID-CLIENT-ID': process.env.PLAID_CLIENT_ID,
            // 'PLAID-SECRET': process.env.PLAID_SECRET,
        }
        // console.log('here: ',tokenParams)

        // this line is the problem
        const response = await plaidClient.linkTokenCreate(tokenParams);

        return parseStringify({ linkToken: response.data.link_token })

    }
    catch(error){
        console.log('error in user.action createLinkToken: ', error)
    }

}

export const createBankAccount = async({userId, bankId, accountId, accessToken, fundingSourceUrl,sharableId}:createBankAccountProps) => {
    try{
        // create a new document
        const { database } = await createAdminClient()
        const bankAccount = await database.createDocument(
            DATABASE_ID!,
            BANK_COLLECTION_ID!,
            ID.unique(),
            {
                userId,
                bankId,
                accountId,
                accessToken,
                fundingSourceUrl,
                sharableId,
            }
        )
        return parseStringify(bankAccount)

    }
    catch(error){
        console.log("error in user.actions createBankAccount: ", error)
    }
}

// exchanges existing access token for tokens that allow to do banking stuffs
// connect a bank account
// making payment transfer between accounts
// connecting payment processors so that user can trasfer funds in the first place
export const exchangePublicToken = async({ publicToken, user}: exchangePublicTokenProps) => {
    try{
        // exchange publicToken for access token and itme ID
        const response = await plaidClient.itemPublicTokenExchange({ public_token: publicToken })
        const accessToken = response.data.access_token
        const itemId = response.data.item_id

        // Get account information from Plaid using the access token
        const accountResponse = await plaidClient.accountsGet({
            access_token:accessToken
        })
        const accountData = accountResponse.data.accounts[0]

        // generate processor token for dwolla(payment processor) using the access otken and account ID
        const request: ProcessorTokenCreateRequest = {
            access_token: accessToken,
            account_id: accountData.account_id,
            processor: 'dwolla' as ProcessorTokenCreateRequestProcessorEnum

        }

        // generate processor token
        const processorTokenResponse = await plaidClient.processorTokenCreate(request)
        const processorToken = processorTokenResponse.data.processor_token

        // create Funding source url for the account using Dwolla customer ID, processor token and bank name
        const fundingSourceUrl = await addFundingSource({
            dwollaCustomerId: user.dwollaCustomerId,
            processorToken,
            bankName: accountData.name
        })
        if(!fundingSourceUrl){
            throw Error;
        }
        // create a bank account using the userId, itemID, accountID, accessToken, fundingsourceUrl and sharable Id
        await createBankAccount({
            userId: user.$id,
            bankId: itemId,
            accountId: accountData.account_id,
            accessToken,
            fundingSourceUrl,
            sharableId: encryptId(accountData.account_id) 
        })
        revalidatePath("/")

        // return success msg
        return parseStringify({
            publicTokenExchange: 'Complete'
        })
    }
    catch(error){
        console.log("Error in user.actions exchangePublicToken: ", error)

    }
}


export const getBanks = async({ userId }: getBanksProps) => {
    try{
        const {database} = await createAdminClient()
        const banks = await database.listDocuments(
            DATABASE_ID!,
            BANK_COLLECTION_ID!,
            [Query.equal('userId', [userId])]
        )
        return parseStringify(banks.documents)
    }
    catch(error){
        console.log('error in getBanksssss', error)
    }
}

// export const getBank = async({ documentId }: getBankProps) => {
//     try{
//         const {database} = await createAdminClient()
//         // console.log('here222', database)
//         const bank = await database.listDocuments(
//             DATABASE_ID!,
//             BANK_COLLECTION_ID!,
//             [Query.equal('$id', [documentId])]
//         )
//         return parseStringify(bank.documents[0])
//     }
//     catch(error){
//         console.log('error in getBank', error)
//     }
// }

export const getBank = async ({ documentId }: getBankProps) => {
    try {
        const { database } = await createAdminClient();
        console.log('Document ID:', documentId);
    
        const bank = await database.listDocuments(
            DATABASE_ID!,
            BANK_COLLECTION_ID!,
            [Query.equal('$id', [documentId])]
    )

    console.log('Bank Query Result:', bank);
    
    return parseStringify(bank.documents[0]);
    } catch (error) {
        console.log('Error in getBank: ',error)
    }
}
