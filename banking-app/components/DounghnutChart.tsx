"use client"

import {Chart as ChartJS, ArcElement, Tooltip, Legend} from 'chart.js';
import {Doughnut} from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend);

const DounghnutChart = ({accounts}:DoughnutChartProps) => {
    //   temp data
    const data={
        datasets:[{
            label:'Banks',
            data: [1250, 730, 7640],
            backgroundColor:['#747b6','#2265d8', '#2f91fa']
        }],
        labels:['Bank1','Bank2','Bank3']
    };
    return (
        <Doughnut data={data}
        options={{
            cutout:'60%',
            plugins:{
                legend:{
                    display: false,
                }
                
            }
        }}/>
    )
}

export default DounghnutChart