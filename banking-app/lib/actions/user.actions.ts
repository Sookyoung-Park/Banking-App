'use server';

import {createSessionClient, createAdminClient} from "../appwrite";
import { ID } from 'node-appwrite'
import { cookies } from "next/headers";
import { parseStringify } from "../utils";

export const signIn = async() => {
    try{
        // Mutation / Database / Fetch
    }
    catch(error){
        console.log('Error in SignIn user.actions : ',error)
    }
}

// export const signUp = async (userData:SignUpParams) => {
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

export async function getLoggedInUser() {
    try {
        const { account } = await createSessionClient();
        return await account.get();
    } catch (error) {
        return null;
    }
}

