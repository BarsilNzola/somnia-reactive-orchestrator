import { useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '../components/Layout';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    router.push('/dashboard');
  }, [router]);

  return (
    <Layout>
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-500">Redirecting to dashboard...</div>
      </div>
    </Layout>
  );
}