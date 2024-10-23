import HeaderBox from '@/components/HeaderBox'
import TotalBalanceBox from '@/components/TotalBalanceBox'
import RightSidebar from '@/components/RightSidebar'
import React from 'react'

const Home = () => {
  const loggedIn = {
    firstName:'Soo',
    lastName:'Park',
    email:'parksk971031@gmail.com'
  }
  return (
    <section className='home'>
      <div className="home-content">
        <header className="home-header">
          <HeaderBox 
          type="greeting"
          title="Welcome"
          user={loggedIn?.firstName || 'Guest' }
          subtext= "Access and manage your account and transactions efficiently."
          />
          <TotalBalanceBox
            accounts={[]}
            totalBanks= {1}
            totalCurrentBalance= {1250.31}
          />
        </header>

        RECENT TRANSACTION
      </div>
      <RightSidebar
      user={loggedIn}
      transactions={[]}
      banks={[{},{}]}
      />
    </section>
  )
}

export default Home