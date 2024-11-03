import React from 'react'
import Link from 'next/link'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import BankInfo from './BankInfo'


const RecentTransactions = ({
    accounts,
    transactions=[],
    appwriteItemId,
    page=1,
}:RecentTransactionsProps) => {
    const currBalanceBof=1300.00
  return (
    <section className="recent-transactions">
        <header className="flex items-center justify-between">
            <h2 className="recent-transactions-label">
                Recent Transactions
            </h2>
            <Link href={`/transaction-history/?id=${appwriteItemId}`}
            className="view-all-btn">View All</Link>
        </header>

        <Tabs defaultValue="account" className="w-full">
            <TabsList className='recent-transactions-tablist'>
                <TabsTrigger value="BankofAmerica">Bank of America</TabsTrigger>
                <TabsTrigger value="chaseBank">Chase Bank</TabsTrigger>
                <TabsTrigger value="detuschBank">Deutsch Bank</TabsTrigger>
            </TabsList>
                
            <TabsContent value="BankofAmerica">Make changes to your account here.</TabsContent>
            <TabsContent value="chaseBank">Change your password here.</TabsContent>
            <TabsContent value="detuschBank">Deutsch Bank Here</TabsContent> 
            
        </Tabs>

    </section>
  )
}

export default RecentTransactions