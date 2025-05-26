# Blessedfood
##Para testing
instalar
pip install pytest==7.4.3 pytest-asyncio==0.21.1 httpx==0.25.2
Para correr el testing
pytest test_main.py -v
para mas detalles
pytest test_main.py -v --tb=short
##Despliegue
**Frontend**: https://cris2305k.github.io/MMSCFOODIE/
**Backend API**: https://mmscfoodie.onrender.com
**Documentación API**: https://mmscfoodie.onrender.com/docs
### Para Backend
pip install -r requirements.txt
uvicorn main:app --reload
