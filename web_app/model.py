

from torchvision.transforms import ToTensor
from torchvision.transforms.functional import to_pil_image, affine


from models.dfcvae import DFCVAE

import torch
import numpy as np

from utils import base64_to_pil_image, pil_image_to_base64

from PIL import Image
import yaml


network_pkl = './PyTorchVAE/logs/DFCVAE/version_8/checkpoints/last.ckpt'
config_file = './PyTorchVAE/configs/dfc_vae.yaml'



class Pipeline(torch.nn.Module):

   def __init__(self, in_size = 256, out_size = 64, has_model = True):
       super().__init__()
       self.out_size = out_size
       self.in_size = in_size
       self.has_model = has_model
       if has_model:
           device = torch.device('cuda')
           self.device = device
           self.convert_tensor = ToTensor()
           with open(config_file, 'r') as file:
               try:
                   config = yaml.safe_load(file)
               except yaml.YAMLError as exc:
                   print(exc)
    
           self.trained_model = DFCVAE(**config['model_params'])
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
       
       img = Image.open('1.png').convert("RGB")
       img_tensor = self.convert_tensor(img).to(self.device)[0].unsqueeze(0).unsqueeze(0)

       img_tensor = torch.nn.functional.interpolate(img_tensor, size=(self.out_size,self.out_size), mode='bilinear',antialias=True)
       print(img_tensor.shape)
       mu, log_var = self.trained_model.encode(img_tensor)
       self.zero_z = mu
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
       if self.has_model:
           img = self.convert_tensor(img).to(self.device)[0].unsqueeze(0).unsqueeze(0)
           img = torch.nn.functional.interpolate(img, size=(self.out_size,self.out_size), mode='bilinear',antialias=True)
           
           # print(f'{img.min()} {img.max()}')
           
           mu, log_var = self.trained_model.encode(img)
           mu = mu - self.zero_z
           mu = torch.clamp(mu, min=-3, max=3)
           
           mu = mu.detach().cpu()
    
           return mu
       else:
           return torch.zeros((1,self.out_size))

#--------------------------------------------

