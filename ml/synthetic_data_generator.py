"""
Synthetic Dataset Generator for AI-Powered Hospitality PMS
Generates realistic sample data for model training and testing
"""

import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import json
import csv
from pathlib import Path


class SyntheticDataGenerator:
    """Generates synthetic data for all ML modules"""
    
    def __init__(self, seed: int = 42):
        np.random.seed(seed)
        self.start_date = datetime(2023, 1, 1)
        self.end_date = datetime(2024, 12, 31)
    
    def generate_demand_forecasting_data(self, n_rows: int = 2000) -> pd.DataFrame:
        """Generate demand forecasting dataset"""
        dates = pd.date_range(self.start_date, self.end_date, freq='D')
        room_types = ['Deluxe King', 'Standard Double', 'Suite', 'Executive']
        
        data = []
        for _ in range(n_rows):
            date = np.random.choice(dates)
            room_type = np.random.choice(room_types)
            
            # Realistic patterns
            is_weekend = date.dayofweek >= 5
            is_holiday = date.month in [12, 1, 7, 8]
            base_occupancy = 0.7 if (is_weekend or is_holiday) else 0.5
            
            bookings = int(np.random.normal(15, 5) + (5 if is_weekend else 0))
            nights_sold = int(np.random.normal(40, 15) + (20 if is_weekend else 0))
            available = 25
            occupancy = min(0.99, max(0.1, base_occupancy + np.random.normal(0, 0.1)))
            
            data.append({
                'property_id': 'prop_001',
                'room_type': room_type,
                'forecast_date': date,
                'bookings_count': max(0, bookings),
                'checkins_count': max(0, bookings - 2),
                'nights_sold': max(0, nights_sold),
                'available_rooms': available,
                'avg_rate': np.random.uniform(80, 280),
                'occupancy_rate': round(occupancy, 2),
                'weather_avg_temp_c': np.random.uniform(10, 35),
                'holiday_flag': int(is_holiday),
                'market_index': np.random.uniform(0.8, 1.2),
                'promotion_active': int(np.random.random() < 0.15),
            })
        
        return pd.DataFrame(data)
    
    def generate_dynamic_pricing_data(self, n_rows: int = 1500) -> pd.DataFrame:
        """Generate dynamic pricing dataset"""
        dates = pd.date_range(self.start_date, self.end_date, freq='D')
        room_types = ['Deluxe King', 'Standard Double', 'Suite']
        
        data = []
        for _ in range(n_rows):
            date = np.random.choice(dates)
            room_type = np.random.choice(room_types)
            
            current_price = np.random.uniform(80, 300)
            competitor_price = current_price + np.random.normal(0, 20)
            occupancy = np.random.uniform(0.2, 0.95)
            lead_time = np.random.randint(1, 90)
            
            # Realistic pricing outcome: higher prices when occupancy is high
            realized_price = current_price * (1 + (occupancy - 0.5) * 0.3) + np.random.normal(0, 10)
            
            data.append({
                'property_id': 'prop_001',
                'room_type': room_type,
                'decision_date': date,
                'current_price': round(current_price, 2),
                'competitor_prices_avg': round(competitor_price, 2),
                'occupancy_rate': round(occupancy, 2),
                'lead_time_days': lead_time,
                'booking_window': 7 if lead_time < 14 else 30,
                'weekday_flag': 1 if date.dayofweek < 5 else 0,
                'special_offer_flag': int(np.random.random() < 0.1),
                'realized_price': round(max(50, realized_price), 2),
                'realized_revenue': round(max(50, realized_price) * np.random.randint(15, 25), 2),
            })
        
        return pd.DataFrame(data)
    
    def generate_guest_stay_data(self, n_rows: int = 1000) -> pd.DataFrame:
        """Generate guest stay data for personalization"""
        data = []
        for i in range(n_rows):
            stay_length = np.random.randint(1, 14)
            spend = stay_length * np.random.uniform(80, 300) + np.random.randint(0, 500)
            
            data.append({
                'property_id': 'prop_001',
                'guest_id': f'guest_{i}',
                'reservation_id': f'res_{i}',
                'arrival_date': self.start_date + timedelta(days=np.random.randint(0, 700)),
                'length_of_stay_days': stay_length,
                'room_type_booked': np.random.choice(['Deluxe King', 'Standard Double', 'Suite']),
                'spend_total': round(spend, 2),
                'purchases_json': json.dumps([
                    {'type': 'spa', 'amount': np.random.randint(0, 200)},
                    {'type': 'dining', 'amount': np.random.randint(0, 300)},
                ]),
                'age_range': np.random.choice(['18-25', '26-35', '36-45', '46-55', '56-65', '65+']),
                'nationality': np.random.choice(['US', 'UK', 'DE', 'FR', 'IT', 'ES', 'JP', 'CN']),
                'feedback_score': np.random.randint(1, 11),
                'preferences': json.dumps({'pillow': 'memory', 'breakfast': True}),
                'channel': np.random.choice(['direct', 'booking.com', 'expedia', 'airbnb']),
                'is_repeat_guest': int(np.random.random() < 0.2),
            })
        
        return pd.DataFrame(data)
    
    def generate_guest_feedback_data(self, n_rows: int = 800) -> pd.DataFrame:
        """Generate guest feedback for sentiment analysis"""
        data = []
        for i in range(n_rows):
            score = np.random.randint(1, 11)
            
            # Generate realistic review text based on score
            if score >= 8:
                reviews = [
                    "Excellent stay! Clean rooms and friendly staff.",
                    "Amazing experience. Would definitely come back.",
                    "Outstanding service and beautiful property."
                ]
            elif score >= 5:
                reviews = [
                    "Good hotel but room was a bit small.",
                    "Average experience. Some issues with room cleanliness.",
                    "Nice location but staff could be more helpful."
                ]
            else:
                reviews = [
                    "Poor experience. Room was dirty and noisy.",
                    "Disappointed with the service and amenities.",
                    "Not worth the price. Many issues during stay."
                ]
            
            data.append({
                'property_id': 'prop_001',
                'guest_id': f'guest_{i}',
                'reservation_id': f'res_{i}',
                'feedback_date': self.start_date + timedelta(days=np.random.randint(0, 700)),
                'review_text': np.random.choice(reviews),
                'review_score': score,
                'nps_score': score - 1 if score <= 6 else score,
                'service_incidents': np.random.randint(0, 4) if score < 7 else 0,
                'complaint_flag': int(score < 6),
                'complaint_details': 'Maintenance issue' if score < 5 else None,
                'feedback_channel': np.random.choice(['survey', 'review_site', 'conversation']),
            })
        
        return pd.DataFrame(data)
    
    def generate_housekeeping_data(self, n_rows: int = 1200) -> pd.DataFrame:
        """Generate housekeeping turnover data"""
        data = []
        for i in range(n_rows):
            expected_duration = np.random.randint(30, 90)
            actual_duration = expected_duration + np.random.normal(0, 15)
            
            data.append({
                'property_id': 'prop_001',
                'room_id': f'room_{np.random.randint(1, 51)}',
                'occupancy_status': 'checked_out',
                'check_out_time': self.start_date + timedelta(days=np.random.randint(0, 700), hours=np.random.randint(9, 12)),
                'expected_clean_duration': expected_duration,
                'actual_clean_duration': int(max(20, actual_duration)),
                'cleaning_staff_id': f'staff_{np.random.randint(1, 11)}',
                'housekeeping_priority': np.random.choice(['low', 'normal', 'high', 'urgent'], p=[0.4, 0.4, 0.15, 0.05]),
                'special_requests': json.dumps(['extra_clean'] if np.random.random() < 0.2 else []),
                'issues_found': json.dumps([
                    {'issue': 'stain', 'location': 'carpet', 'severity': 'high'}
                ] if np.random.random() < 0.15 else []),
                'days_before_turnover': np.random.randint(1, 7),
                'date_recorded': self.start_date + timedelta(days=np.random.randint(0, 700)),
            })
        
        return pd.DataFrame(data)
    
    def generate_equipment_data(self, n_rows: int = 600) -> pd.DataFrame:
        """Generate equipment maintenance data"""
        data = []
        for i in range(n_rows):
            data.append({
                'property_id': 'prop_001',
                'equipment_id': f'eq_{i % 30}',  # 30 unique equipment
                'equipment_type': np.random.choice(['HVAC', 'pump', 'generator', 'water_heater', 'elevator']),
                'installation_date': self.start_date - timedelta(days=np.random.randint(365, 1825)),
                'usage_hours': np.random.randint(500, 5000),
                'last_service_date': self.start_date - timedelta(days=np.random.randint(30, 180)),
                'fault_events_count': np.random.randint(0, 5),
                'sensor_readings': json.dumps({
                    'temp': round(np.random.uniform(50, 90), 1),
                    'vibration': round(np.random.uniform(0.1, 0.8), 2),
                    'pressure': round(np.random.uniform(100, 150), 1),
                }),
                'maintenance_costs': round(np.random.exponential(300), 2),
                'maintenance_notes': 'Routine maintenance' if np.random.random() < 0.8 else 'Emergency repair',
                'recorded_date': self.start_date + timedelta(days=np.random.randint(0, 700)),
            })
        
        return pd.DataFrame(data)
    
    def generate_transaction_data(self, n_rows: int = 2000) -> pd.DataFrame:
        """Generate transaction data for fraud detection"""
        data = []
        fraud_rate = 0.05
        
        for i in range(n_rows):
            is_fraud = np.random.random() < fraud_rate
            
            data.append({
                'transaction_id': f'txn_{i}',
                'property_id': 'prop_001',
                'guest_id': f'guest_{np.random.randint(0, 500)}',
                'reservation_id': f'res_{np.random.randint(0, 300)}',
                'amount': round(np.random.lognormal(4, 1.5), 2) if not is_fraud else round(np.random.uniform(5000, 20000), 2),
                'currency': 'USD',
                'payment_method': np.random.choice(['card', 'cash']),
                'card_bin': np.random.randint(400000, 700000),
                'ip_address': f'192.168.{np.random.randint(0, 256)}.{np.random.randint(0, 256)}',
                'ip_country': np.random.choice(['US', 'UK', 'DE', 'FR', 'ES', 'RU', 'CN']),
                'booking_ip_country': np.random.choice(['US', 'UK', 'DE', 'FR', 'ES', 'RU', 'CN']),
                'booking_channel': np.random.choice(['direct', 'booking.com', 'expedia']),
                'device_id': f'dev_{np.random.randint(0, 100)}',
                'device_type': np.random.choice(['mobile', 'desktop', 'tablet']),
                'transaction_date': self.start_date + timedelta(days=np.random.randint(0, 700), hours=np.random.randint(0, 24)),
                'flagged_discrepancies': json.dumps([{'type': 'velocity'}] if is_fraud else []),
                'is_fraud': int(is_fraud),
            })
        
        return pd.DataFrame(data)
    
    def generate_pos_sales_data(self, n_rows: int = 3000) -> pd.DataFrame:
        """Generate POS sales data"""
        items = {
            'coffee_001': {'price': 3.50, 'category': 'beverage'},
            'tea_001': {'price': 2.50, 'category': 'beverage'},
            'sandwich_001': {'price': 8.50, 'category': 'food'},
            'pasta_001': {'price': 14.00, 'category': 'food'},
            'wine_001': {'price': 25.00, 'category': 'beverage'},
        }
        
        data = []
        for _ in range(n_rows):
            item_id = np.random.choice(list(items.keys()))
            item_info = items[item_id]
            date = self.start_date + timedelta(days=np.random.randint(0, 700))
            
            # Higher sales on weekends
            is_weekend = date.dayofweek >= 5
            qty_factor = 1.5 if is_weekend else 1.0
            qty = int(np.random.poisson(5 * qty_factor)) + 1
            
            data.append({
                'property_id': 'prop_001',
                'outlet_id': 'restaurant_01',
                'sales_date': date,
                'item_id': item_id,
                'item_name': item_id,
                'category': item_info['category'],
                'sales_qty': qty,
                'stock_level': np.random.randint(10, 200),
                'price': item_info['price'],
                'promotion_flag': int(np.random.random() < 0.1),
                'event_flag': int(np.random.random() < 0.05),
                'day_of_week': date.dayofweek,
                'month': date.month,
            })
        
        return pd.DataFrame(data)
    
    def save_all_datasets(self, output_dir: str = './data'):
        """Generate and save all synthetic datasets"""
        Path(output_dir).mkdir(exist_ok=True)
        
        print(f"Generating synthetic datasets to {output_dir}...")
        
        datasets = {
            'demand_forecasting_data.csv': self.generate_demand_forecasting_data(),
            'dynamic_pricing_data.csv': self.generate_dynamic_pricing_data(),
            'guest_stay_data.csv': self.generate_guest_stay_data(),
            'guest_feedback_data.csv': self.generate_guest_feedback_data(),
            'housekeeping_turnovers.csv': self.generate_housekeeping_data(),
            'equipment_data.csv': self.generate_equipment_data(),
            'transaction_data.csv': self.generate_transaction_data(),
            'pos_sales_data.csv': self.generate_pos_sales_data(),
        }
        
        for filename, df in datasets.items():
            filepath = f'{output_dir}/{filename}'
            df.to_csv(filepath, index=False)
            print(f"✓ Generated {filename} ({len(df)} rows)")
        
        print(f"\nAll datasets generated successfully!")
        return datasets


if __name__ == '__main__':
    generator = SyntheticDataGenerator(seed=42)
    generator.save_all_datasets('./ml/data')
