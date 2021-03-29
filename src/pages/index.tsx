import { GetStaticProps } from 'next';
import Link from 'next/link';
import Head from 'next/head';
import Header from '../components/Header';

import { getPrismicClient } from '../services/prismic';
import Prismic from '@prismicio/client';

import commonStyles from '../styles/common.module.scss';
import styles from './home.module.scss';

import { FiCalendar, FiUser } from 'react-icons/fi';
import { useEffect, useState } from 'react';

import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Post {
  uid?: string;
  first_publication_date: string | null;
  data: {
    title: string;
    subtitle: string;
    author: string;
  };
}

interface PostsProps {
  posts: Post[];
}

interface PostPagination {
  next_page: string;
  results: Post[];
}

interface HomeProps {
  postsPagination: PostPagination;
}

export default function Home({ postsPagination }: HomeProps) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [nextPage, setNextPage] = useState('');

  useEffect(() => {
    setPosts(postsPagination.results);
    setNextPage(postsPagination.next_page);
  }, [postsPagination.results, postsPagination.next_page]);

  const handlePagination = () => {
    fetch(nextPage)
      .then(res => res.json())
      .then(data => {
        const formattedData = data.results.map(post => {
          return {
            uid: post.uid,
            first_publication_date: post.first_publication_date,
            data: {
              title: post.data.title,
              subtitle: post.data.subtitle,
              author: post.data.author,
            },
          };
        });

        setPosts([...posts, ...formattedData]);
        setNextPage(data.next_Page);
      });
  };

  return (
    <>
      <Head>
        <title>Home | Blog-show</title>
      </Head>

      <main className={styles.container}>
        <div>
          <section>
            <Header />
          </section>

          <section>
            {posts.map(post => (
              <div key={post.uid} className={styles.post}>
                <Link href={`/post/${post.uid}`}>
                  <a>
                    <p>{post.data.title}</p>
                  </a>
                </Link>
                <span>{post.data.subtitle}</span>
                <div className={styles.details}>
                  <time>
                    <FiCalendar />
                    {format(
                      new Date(post.first_publication_date),
                      'dd MMM yyyy',
                      { locale: ptBR }
                    )}
                  </time>
                  <p>
                    <FiUser /> {post.data.author}
                  </p>
                </div>
              </div>
            ))}
            {nextPage && (
              <button type="button" onClick={handlePagination}>
                <span>Carregar mais posts</span>
              </button>
            )}
          </section>
        </div>
      </main>
    </>
  );
}

export const getStaticProps: GetStaticProps = async () => {
  const prismic = getPrismicClient();

  const postsResponse = await prismic.query(
    [Prismic.predicates.at('document.type', 'post')],
    {
      fetch: ['post.title', 'post.subtitle', 'post.author'],
      pageSize: 2,
    }
  );

  const posts = postsResponse.results.map(post => {
    return {
      uid: post.uid,
      first_publication_date: post.first_publication_date,
      // first_publication_date: new Date(
      //   post.first_publication_date
      // ).toLocaleDateString('pt-BR', {
      //   day: '2-digit',
      //   month: 'long',
      //   year: 'numeric',
      // }),
      data: {
        title: post.data.title,
        subtitle: post.data.subtitle,
        author: post.data.author,
      },
    };
  });

  console.log(postsResponse);
  return {
    props: {
      postsPagination: {
        next_page: postsResponse.next_page,
        results: posts,
      },
    },
  };
};
