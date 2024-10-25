'use server';

export const signIn = async() => {
    try{
        // Mutation / Database / Fetch
    }
    catch(error){
        console.log('Error in SignIn user.actions : ',error)
    }
}

export const signUp = async(userData:SignUpParams) => {
    try{
        // Create a user account using appwrite
    }
    catch(error){
        console.log('Error in SignUp user.actions : ',error)
    }
}