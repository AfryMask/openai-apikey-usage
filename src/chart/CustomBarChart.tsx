
import CustomTooltip from "./CustomTooltip"
import { useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Cell
} from 'recharts';

type ChartData = { [key: string]: any };

interface CustomBarChartProps {
    data: ChartData[];
    dataKeys: string[];
    fills: string[];
}

const CustomBarChart = ({ data, dataKeys, fills }:CustomBarChartProps) => {

    const [activeIndex, setActiveIndex] = useState(-1);

    const renderCustomBar = (props: any) => {
        const { fill, index, activeIndex, ...restProps } = props;
        const isActive = index === activeIndex;
        return <Cell cursor="pointer" opacity={isActive||activeIndex===-1 ? 1.0 : 0.7} {...restProps} />;
    };

    const onMouseOver = (data: any, index: number) => {
        setActiveIndex(index);
    };

    const onMouseOut = () => {
        setActiveIndex(-1);
    };
    
    return (<BarChart
      width={500}
      height={300}
      data={data}
      margin={{
        top: 20,
        right: 30,
        left: 20,
        bottom: 5
      }}
    >
      <CartesianGrid horizontal={true} vertical={false} strokeDasharray="3 0" />
      <XAxis dataKey="date" />
      <YAxis tickFormatter={(tick) => `$${tick}`} />
      <Tooltip content={<CustomTooltip />} cursor={false} />
      
      {dataKeys.map((key, index) => (
        <Bar dataKey={key} stackId="a" fill={fills[index]} onMouseOver={onMouseOver} onMouseOut={onMouseOut}>

        {data.map((entry, index) => (
          renderCustomBar({ ...entry, index, activeIndex, fill: fills[index] })
        ))}
      </Bar>
      ))}
      
    </BarChart>)
    
  };
  
  export default CustomBarChart;
  