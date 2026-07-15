import React, { useEffect, useState } from "react";
import Layout from "@/components/layout/Layout";
import { supabase } from "@/lib/supabase";
import { useNavigate } from "react-router-dom";



export default function CreateBook() {

  const navigate = useNavigate();

  const [loading,setLoading] = useState(false);

  const [title,setTitle] = useState("");
  const [description,setDescription] = useState("");

  const [cover,setCover] = useState<File | null>(null);


  useEffect(()=>{
    checkStudent();
  },[]);



  async function checkStudent(){

    const {
      data:{user}
    } = await supabase.auth.getUser();


    if(!user){
      navigate("/login");
      return;
    }


    const email = user.email;


    if(
      !email ||
      !email.toLowerCase().endsWith("@everyones.com.mv")
    ){

      alert(
        "Only ELC students can create books."
      );

      navigate("/authorsofelc");

    }

  }







 async function createBook(){

if(!title){
  alert("Please enter book title");
  return;
}


setLoading(true);


try{


const {
 data:{user}
} = await supabase.auth.getUser();



if(!user){

 navigate("/login");
 return;

}



let coverUrl =
"/images/ebook-placeholder.jpg";



if(cover){


const fileName =
`${user.id}-${Date.now()}-${cover.name}`;



const {
error:uploadError
}
=
await supabase.storage
.from("book-covers")
.upload(
fileName,
cover,
{
upsert:true
}
);



if(uploadError)
throw uploadError;



const {
data
}
=
supabase.storage
.from("book-covers")
.getPublicUrl(fileName);



coverUrl =
data.publicUrl;


}




const {
data:newBook,
error
}
=
await supabase
.from("books")
.insert({

title:title,

description:description,

author_name:
  user.user_metadata?.full_name ||
  "ELC Student",

author_email:
user.email,

published:false,

cover_url:coverUrl

})
.select()
.single();



if(error)
throw error;



if(newBook){

navigate(
`/edit-book/${newBook.id}`
);

}



}
catch(error:any){

console.error(error);

alert(
error.message ||
"Unable to create book"
);


}
finally{

setLoading(false);

}


}



  return (

    <Layout>


      <div className="
      max-w-xl
      mx-auto
      p-6
      ">


        <h1 className="
        text-3xl
        font-bold
        text-[#1F6F43]
        mb-6
        ">

          Create New Book

        </h1>





        <input

          className="
          w-full
          border
          rounded-lg
          p-3
          mb-4
          "

          placeholder="Book title"

          value={title}

          onChange={
            e=>setTitle(e.target.value)
          }

        />





        <textarea

          className="
          w-full
          border
          rounded-lg
          p-3
          mb-4
          "

          rows={5}

          placeholder="Book description"

          value={description}

          onChange={
            e=>setDescription(e.target.value)
          }

        />

<label
  className="
  block
  w-full
  border
  p-3
  rounded-lg
  mb-4
  cursor-pointer
  bg-gray-50
  text-gray-700
  "
>

  {cover
    ? cover.name
    : "Choose a book cover"
  }


  <input

    type="file"

    accept="image/*"

    className="hidden"

    onChange={(e)=>
      setCover(
        e.target.files?.[0] || null
      )
    }

  />

</label>




        <button

          onClick={createBook}

          disabled={loading}

          className="
          bg-[#1F6F43]
          text-white
          px-6
          py-3
          rounded-lg
          "

        >

          {
            loading
            ?
            "Creating..."
            :
            "Create Book"
          }


        </button>



      </div>


    </Layout>

  );

}