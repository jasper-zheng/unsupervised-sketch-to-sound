
# from torchvision.transforms import GaussianBlur
from torchvision.transforms import ToTensor
from torchvision.transforms.functional import to_pil_image, affine

# from benchmark_VAE.src.pythae.models import AutoModel
from models.dfcvae import DFCVAE

import torch
import numpy as np

from utils import base64_to_pil_image, pil_image_to_base64

from PIL import Image
import yaml

# from pythonosc import udp_client
# from training.training_loop import Preprocess

network_pkl = '/home/jasper/Documents/PhD/Y0/vae_sketch_to_sound/src/PyTorchVAE/logs/DFCVAE/version_8/checkpoints/last.ckpt'
config_file = '/home/jasper/Documents/PhD/Y0/vae_sketch_to_sound/src/PyTorchVAE/configs/dfc_vae.yaml'



class Pipeline(torch.nn.Module):

   def __init__(self, in_size = 256, out_size = 64):
       super().__init__()
       self.out_size = out_size
       self.in_size = in_size
       device = torch.device('cuda')
       self.device = device
       self.convert_tensor = ToTensor()
       # self.client = udp_client.SimpleUDPClient(ip, port)

       with open(config_file, 'r') as file:
           try:
               config = yaml.safe_load(file)
           except yaml.YAMLError as exc:
               print(exc)

       self.trained_model = DFCVAE(**config['model_params'])
       # self.trained_model = AutoModel.load_from_folder(network_pkl).to(device)
       checkpoint = torch.load(network_pkl)
       keys = list(checkpoint['state_dict'].items())
       for k in keys:
           # print(k[0])
           checkpoint['state_dict'][k[0].split('model.')[1]] = checkpoint['state_dict'][k[0]]
           del checkpoint['state_dict'][k[0]]
       self.trained_model.load_state_dict(checkpoint['state_dict'])
       self.trained_model.eval()
       self.trained_model.to(device)

       print('model loaded')
       self.initialise_plugins()

   def initialise_plugins(self):
      #  img = torch.zeros((1,3,self.in_size,self.in_size)).to(self.device)
       img = Image.open('1.png').convert("RGB")
       img_tensor = self.convert_tensor(img).to(self.device)[0].unsqueeze(0).unsqueeze(0)

       img_tensor = torch.nn.functional.interpolate(img_tensor, size=(self.out_size,self.out_size), mode='bilinear',antialias=True)
       print(img_tensor.shape)
       # img = torch.nn.functional.interpolate(img, size=(112,112))
       # z = self.trained_model.embed(img_tensor).detach().cpu()
       mu, log_var = self.trained_model.encode(img_tensor)
       mu = mu.detach().cpu()
       # self.z = mu
       return mu



   def forward(self, img):
       '''
       parameter:
           img: PIL Image
       return:
           PIL Image

       '''
       img = self.convert_tensor(img).to(self.device)[0].unsqueeze(0).unsqueeze(0)
       img = torch.nn.functional.interpolate(img, size=(self.out_size,self.out_size), mode='bilinear',antialias=True)
       
       # print(f'{img.min()} {img.max()}')
       
       mu, log_var = self.trained_model.encode(img)
       # z = self.trained_model.reparameterize(mu, log_var).detach().cpu()
       # print(f'min:{mu.min()}\t max:{mu.max()}')
       mu = torch.clamp(mu, min=-3, max=3)
       
       mu = mu.detach().cpu()

       # self.send_osc(mu)
       
       return mu

   # def send_osc(self, z):
   #     self.client.send_message("/wek/inputs", z[0].tolist())



#--------------------------------------------

