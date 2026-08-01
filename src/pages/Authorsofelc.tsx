import React, { useEffect, useState } from "react";
import Layout from "@/components/layout/Layout";
import { supabase } from "@/lib/supabase";
import { useNavigate } from "react-router-dom";

interface Ebook {
  id: string;
  title: string;
  author_name: string;
  description: string;
  cover_url: string;
  pdf_url?: string;
}


export default function Gallery() {

  const [ebooks, setEbooks] = useState<Ebook[]>([]);
  const [filteredBooks, setFilteredBooks] = useState<Ebook[]>([]);
  const [search, setSearch] = useState("");

  const [isStudent, setIsStudent] = useState(false);

  const navigate = useNavigate();



  useEffect(() => {


    async function checkUser() {

      const { data } = await supabase.auth.getUser();

      const email = data.user?.email;


      if(
        email &&
        email.endsWith("@everyones.com.mv")
      ){

        setIsStudent(true);

      }

    }



    async function loadBooks(){

      const {
        data,
        error
      } = await supabase

        .from("books")

        .select("*")

        .eq(
          "published",
          true
        )

        .order(
          "created_at",
          {
            ascending:false
          }
        );



      if(!error && data){

        setEbooks(data);

        setFilteredBooks(data);

      }

    }



    checkUser();

    loadBooks();


  },[]);





  useEffect(()=>{


    const value =
      search.toLowerCase();



    const results =
      ebooks.filter(book =>


        book.title
          .toLowerCase()
          .includes(value)

        ||

        book.author_name
          .toLowerCase()
          .includes(value)


      );



    setFilteredBooks(results);



  },[search,ebooks]);





  return (

    <Layout>


      <section className="bg-[#1F6F43] py-16">

        <div className="text-center text-white px-4">


          <h1 className="
          font-serif
          text-4xl
          md:text-5xl
          font-bold
          mb-4
          ">

            Student Submitted E-Books

          </h1>



          <p className="
          text-white/90
          max-w-2xl
          mx-auto
          ">

            Explore creative e-books written and designed by our students.

          </p>




          {isStudent && (

          <div className="
          mt-6
          flex
          justify-center
          gap-4
          ">


            <button

              className="
              bg-white
              text-[#1F6F43]
              px-6
              py-3
              rounded-lg
              font-semibold
              "

              onClick={() =>
                navigate("/create-book")
              }

            >

              Create New Book

            </button>



            <button

              className="
              bg-white
              text-[#1F6F43]
              px-6
              py-3
              rounded-lg
              font-semibold
              "

              onClick={() =>
                navigate("/my-books")
              }

            >

              My Books

            </button>


          </div>

          )}


        </div>

      </section>






      <section className="
      py-12
      bg-[#F4F6F8]
      ">


        <div className="
        max-w-7xl
        mx-auto
        px-4
        ">



          <div className="
          mb-8
          flex
          flex-col
          md:flex-row
          justify-between
          gap-4
          ">


            <input

              type="text"

              placeholder="Search by title or author..."

              value={search}

              onChange={(e)=>
                setSearch(e.target.value)
              }

              className="
              w-full
              md:w-96
              border
              rounded-lg
              p-3
              "
            />



            <p className="
            text-gray-600
            self-center
            ">

              {filteredBooks.length} books found

            </p>



          </div>





          {filteredBooks.length === 0 ? (

            <div className="
            text-center
            py-20
            text-gray-500
            ">


              <h2 className="
              text-2xl
              font-semibold
              ">

                No e-books found

              </h2>


            </div>


          ) : (



          <div className="
          grid
grid-cols-2
sm:grid-cols-3
md:grid-cols-4
lg:grid-cols-6
gap-6
          ">


          {filteredBooks.map((book)=>(


           <div
key={book.id}
className="
bg-white
rounded-lg
p-3
hover:shadow-lg
transition
"
>


<img
  src={
    book.cover_url ||
    "/images/ebook-placeholder.jpg"
  }
  alt={book.title}
  className="
  w-full
  aspect-[2/3]
  object-cover
  rounded-md
"
/>



<h2

className="
font-semibold
text-sm
text-[#1F6F43]
mt-3
line-clamp-2
"

>

{book.title}

</h2>



<p

className="
text-xs
text-gray-600
mt-1
line-clamp-1
"

>

{book.author_name}

</p>



<button

onClick={() =>
navigate(`/book/${book.id}`)
}

className="
mt-3
w-full
bg-[#1F6F43]
text-white
text-sm
py-2
rounded-md
"

>

Read

</button>



</div>


          ))}


          </div>


          )}



        </div>


      </section>


    </Layout>

  );

}