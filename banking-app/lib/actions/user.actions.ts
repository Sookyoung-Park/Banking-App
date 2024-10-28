'use server';

import {createSessionClient, createAdminClient} from "../appwrite";
import { ID } from 'node-appwrite'
import { cookies } from "next/headers";
import { parseStringify } from "../utils";
import { plaidClient } from "../plaid";
import { CountryCode, Products } from "plaid";

export const signIn = async(userData:signInProps) => {
    const { email, password } = userData
    try{
        const { account } = await createAdminClient();
        const response = await account.createEmailPasswordSession(email, password);
        return parseStringify(response);
    }
    catch(error){
        console.log('Error in SignIn user.actions : ',error)
    }
}

export const signUp = async (userData:SignUpParams) => {
    const {email, password, firstName, lastName} = userData
    try{
        // Create a user account using appwrite - create from appwrite signup with email doc
        const { account } = await createAdminClient();

        const newUserAccount = await account.create(
            ID.unique(), 
            email, 
            password, 
            `${firstName} ${lastName}`
            );
        const session = await account.createEmailPasswordSession(email, password);


        cookies().set("appwrite-session", session.secret, {
            path: "/",
            httpOnly: true,
            sameSite: "strict",
            secure: true,
        });
        return parseStringify(newUserAccount)
    }
    catch(error){
        console.log('Error in SignUp user.actions : ',error)
    }
}

export const getLoggedInUser = async () => {
    try {
        const { account } = await createSessionClient();
        const user = await account.get();
        return parseStringify(user)
        
    } catch (error) {
        console.log(error)
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
        console.log(error)
        return false
    }
}

export const createLinkToken = async(user: User) => {
    try{
        const tokenParams = {
            user:{
                client_user_id: user.$id
            },
            client_name: user.name,
            products: ['auth'] as Products[],
            language: 'en',
            country_codes: ['US'] as CountryCode,
        }
        const response = await plaidClient.linkTokenCreate(tokenParams);

    }
    catch(error){
        console.log('error in user.action createLinkToken: ', error)
    }

}
