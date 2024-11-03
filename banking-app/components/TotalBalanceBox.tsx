import AnimatedCounter from './AnimatedCounter'
import DounghnutChart from './DounghnutChart'

const TotalBalanceBox = ({accounts, totalBanks, totalCurrentBalance}:TotlaBalanceBoxProps) => {
  const totalCurrBalance= 5342.10
  const totalBankNr=3
  return (
    <section className='total-balance flex'>
      <div className="total-balance-chart">
        <DounghnutChart accounts={accounts}/>
      </div>
      <div className="flex flex-col gap-6">
        <h2 className="header-2">
          {totalBankNr} Bank Accounts
        </h2>
        <div className="flex flex-col gap-2">
          <p className="total-balance-label">
            Total Current Balance
          </p>
          <div className="total-balance-amount flex-center gap-2">
            <AnimatedCounter
            // amount = {totalCurrentBalance}
            amount = {totalCurrBalance}/>
          </div>
        </div>
      </div>
      
    </section>
  )
}

export default TotalBalanceBox